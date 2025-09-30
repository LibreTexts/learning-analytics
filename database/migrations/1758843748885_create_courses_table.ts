import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'courses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('adapt_id').notNullable()
      table.integer('instructor_id').notNullable()
      table.string('name')
      table.string('textbook_url')
      table.boolean('is_in_adapt').notNullable().defaultTo(false)
      table.boolean('letter_grades_released').notNullable().defaultTo(false)
      table.boolean('share_grade_distribution').notNullable().defaultTo(false)
      table.timestamp('start_date')
      table.timestamp('end_date')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}