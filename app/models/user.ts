import { DateTime } from 'luxon'
import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import hash from '@adonisjs/core/services/hash';
import { compose } from '@adonisjs/core/helpers';

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
});

export default class User extends compose(BaseModel, AuthFinder) {
  public static namingStrategy = new SnakeCaseNamingStrategy();
  
  @column({ isPrimary: true })
  declare user_id: number

  @column()
  declare email: string

  @column()
  declare password: string

  @column()
  declare role: string;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}