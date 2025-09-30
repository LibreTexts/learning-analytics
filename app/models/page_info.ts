import { DateTime } from 'luxon'
import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

export default class PageInfo extends BaseModel {
  public static namingStrategy = new SnakeCaseNamingStrategy();

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare type: string;

  @column()
  declare text: string;

  @column()
  declare course_name: string;

  @column()
  declare url: string;

  @column()
  declare subdomain: string;

  @column()
  declare path: string[]

  @column()
  declare chapter: string;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}