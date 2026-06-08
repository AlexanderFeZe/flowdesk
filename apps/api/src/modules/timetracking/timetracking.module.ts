import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetrackingService } from './timetracking.service';
import { TimetrackingController } from './timetracking.controller';
import { TimeEntry } from './entities/time-entry.entity';
import { Task } from '../tasks/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, Task])],
  controllers: [TimetrackingController],
  providers: [TimetrackingService],
})
export class TimetrackingModule {}