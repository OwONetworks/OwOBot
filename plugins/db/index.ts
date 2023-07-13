import knex from 'knex'
import config from '../../config'

const db = knex(config.plugins.db)

export default db
