const DB = require('./db')
const moment = require('moment')

const db = DB('measurements', process.env.FAUNADB_SECRET)

const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
db.add_record({
  pulse: 100, bp_systolic: 140, bp_diastolic: 90, glucose_level: 5, timestamp
}).then(result => {
  console.log(result)
}).then(db.get_records)
  .then(res => console.log(res.data.map(r => r.data)))
