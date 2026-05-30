import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Resolve accurate status codes based on the underlying exception footprint
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Parse incoming message anomalies cleanly
    let message = 'An unexpected error occurred within the core platform engine';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'object' && errorResponse !== null) {
        const responseObj = errorResponse as Record<string, any>;
        message = responseObj['message'] || exception.message;
        
        // Properly flatten structural arrays thrown by class-validator constraints
        if (Array.isArray(responseObj['message'])) {
          errors = responseObj['message'];
          message = 'Validation constraints validation mismatch';
        } else {
          errors = [message];
        }
      } else {
        message = exception.message;
        errors = [message];
      }
    } else if (exception instanceof Error) {
      // Prevent internal database connection logs or system paths leaking during production runs
      message = process.env.NODE_ENV === 'development' ? exception.message : message;
      errors = [message];
    }

    // Format output payload structures strictly to lock unified response criteria compliance
    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }
}