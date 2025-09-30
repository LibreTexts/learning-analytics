import { DateTime } from 'luxon'
import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

export default class Metatag extends BaseModel {
  public static namingStrategy = new SnakeCaseNamingStrategy();

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare page_id: string

  @column()
  declare count: number

  @column()
  declare href: string

  @column()
  declare value: string

  @column()
  declare at_id: string

  @column()
  declare at_href: string

  @column()
  declare title: string

  @column()
  declare type: string

  @column()
  declare ui: string

  @column()
  declare subdomain: string

  @column()
  declare _id__baas_transaction?: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}