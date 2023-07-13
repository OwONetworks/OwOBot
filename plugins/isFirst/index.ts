import db from '../db'

const init = async () => {
  await db.schema.createTableIfNotExists('plugin_firsts', table => {
    table.string('user_id')
    table.boolean('flag').defaultTo(false)
    table.string('function_id').defaultTo('')
  })
}

init()

export default async (userId: string, functionId: string) => {
  const result = await db('plugin_firsts')
    .select()
    .where('user_id', userId)
    .where('function_id', functionId)
    .first()
  if (!result) {
    await db('plugin_firsts').insert({
      user_id: userId,
      function_id: functionId,
      flag: true
    })
    return true
  } else {
    return false
  }
}