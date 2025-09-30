import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import Enrollment from './enrollment.js';
import type { HasMany } from '@adonisjs/lucid/types/relations';

export default class Course extends BaseModel {
  public static namingStrategy = new SnakeCaseNamingStrategy();

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare adapt_id: number

  @column()
  declare instructor_id: string

  @column()
  declare name?: string

  @column()
  declare textbook_url?: string

  @column()
  declare is_in_adapt: boolean

  @column()
  declare letter_grades_released?: boolean

  @column()
  declare share_grade_distribution?: boolean

  @column()
  declare start_date?: DateTime

  @column()
  declare end_date?: DateTime

  @hasMany(() => Enrollment, {
    foreignKey: 'course_id',
    localKey: 'adapt_id',
  })
  declare enrollments: HasMany<typeof Enrollment>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}