import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'metatags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('page_id').notNullable()
      table.integer('count').notNullable()
      table.string('href').notNullable()
      table.string('value').notNullable()
      table.string('at_id').notNullable()
      table.string('at_href').notNullable()
      table.string('title').notNullable()
      table.string('type').notNullable()
      table.string('ui').notNullable()
      table.string('subdomain').notNullable()
      table.string('_id__baas_transaction')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}