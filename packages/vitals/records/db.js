const faunadb = require('faunadb'), q = faunadb.query

module.exports = (name, secret) => {
  if (!name) throw new Error('Missing database name parameter')
  if (!secret) throw new Error('Missing database secret parameter')

  const client = new faunadb.Client({ secret })

  const add_record = async field_values => {
    return client.query(
      q.Create(q.Collection(name), { data: field_values })
    )
  }

  const get_records = async () => {
    return client.query(q.Map(
      q.Paginate(q.Documents(q.Collection(name)), {size: 1000}),
      q.Lambda(x => q.Get(x))
    ))
  }

  return { add_record, get_records }
}
