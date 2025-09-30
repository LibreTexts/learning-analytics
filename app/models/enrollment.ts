import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import Course from './course.js';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class Enrollment extends BaseModel {
  public static namingStrategy = new SnakeCaseNamingStrategy();

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare student_id: string;

  @column()
  declare email: string;

  @column()
  declare course_id: string;

  @belongsTo(() => Course, {
    foreignKey: 'adapt_id',
    localKey: 'course_id',
  })
  declare course: BelongsTo<typeof Course>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}