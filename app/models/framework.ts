import { DateTime } from 'luxon'
import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

export default class Framework extends BaseModel {
  public static namingStrategy = new SnakeCaseNamingStrategy();

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare adapt_id: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}