const moment = require('moment')
const DB = require('./db')

const db = DB(process.env.FAUNADB_COLLECTION, process.env.FAUNADB_SECRET)

function isNumeric(args, field, floatOK = false) {
    let val = args[field]
    if (typeof(val) === 'string') {
        try {
            val = floatOK ? parseFloat(val) : parseInt(val)
        } catch (e) {
            val = undefined
        }
    }
    
    if (Number.isInteger(val) || (floatOK && !isNaN(val))) {
        return Promise.resolve()
    } else {
        return Promise.reject(`${field} is not a valid numeric value`)
    }
}

async function addRecord(args) {
  try {
    const valid = await Promise.all([
      isNumeric(args, 'pulse'),
      isNumeric(args, 'bp_systolic'),
      isNumeric(args, 'bp_diastolic'),
      isNumeric(args, 'glucose_level', true)
    ])
  } catch (e) {
    return {
      body: { ok: false, error: e.message }
    }
  }

  const { pulse = 0, bp_systolic = 0, bp_diastolic = 0, glucose_level = 0 } = args
  const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  try {
    await db.add_record({
      pulse, bp_systolic, bp_diastolic, glucose_level, timestamp
    })
  } catch (e) {
    console.log(e)
    return {
      body: { ok: false, error: e.message }
    }
  }
    
  return {
    statusCode: 303,
    headers: {
      location: `/diary.html`
    }
  }
}

async function getRecords(args) {
  try {
    const results = await db.get_records()
    const rows = results.data.map(r => r.data)
    return { body: rows }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: {
      ok: false, error: 'Internal error.'
    }}
  }
}

async function router(args) {
  switch (args.__ow_method || '') {
    case 'get': return getRecords(args)
    case 'post': return addRecord(args)
    default: return {
      statusCode: 405,
      body: 'Method not allowed.'
    }
  }
}

module.exports.main = router
