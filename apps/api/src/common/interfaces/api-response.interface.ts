/**
 * Global envelope for all API responses to ensure a unified format.
 * @template T The type of the data payload.
 */
export class ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
  }

  /**
   * Helper method to generate successful responses.
   */
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse<T>({
      success: true,
      data,
      message,
    });
  }

  /**
   * Helper method to generate failure responses.
   */
  static error(errors: string[], message?: string): ApiResponse<null> {
    return new ApiResponse<null>({
      success: false,
      message,
      errors,
    });
  }
}