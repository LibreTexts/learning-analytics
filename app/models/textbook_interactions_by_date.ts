import { DateTime } from 'luxon'
import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

export default class TextbookInteractionsByDate extends BaseModel {
  public static namingStrategy = new SnakeCaseNamingStrategy();
  
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare actor: string

  @column()
  declare num_interactions: number

  @column()
  declare date: DateTime;

  @column()
  declare textbook_id: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}