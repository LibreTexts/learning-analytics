import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'page_info'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').notNullable().primary()
      table.string('title').notNullable()
      table.string('type').notNullable()
      table.text('text').notNullable()
      table.string('course_name').notNullable()
      table.string('url').notNullable()
      table.string('subdomain').notNullable()
      table.json('path').notNullable()
      table.string('chapter').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}