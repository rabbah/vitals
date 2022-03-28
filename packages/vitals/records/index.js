const moment = require('moment')
const { mysql } = require('./nim')

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
            body: {
                ok: false,
                error: e.message
            }
        }
    }

    const {pulse = 0, bp_systolic = 0, bp_diastolic = 0, glucose_level = 0 } = args
    return mysql.then(connection => {
        const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
        return connection.query(
            `INSERT INTO vitals(pulse, bp_systolic, bp_diastolic, glucose_level, created_on)
             VALUES ("${pulse}", "${bp_systolic}", "${bp_diastolic}", "${glucose_level}", "${timestamp}")`
        )
    }).then(([rows, fields]) => {
        return {
            statusCode: 303,
            headers: {
                location: `/diary.html`
            }
        }
    }).catch(e => {
        console.log(e)

        return {
            body: {
                ok: false,
                error: e.message
            }
        }
    })
}

async function getRecords(args) {
    return mysql
        .then(connection => connection.query(`SELECT * FROM vitals;`))
        .then(([rows, fields]) => ({ body: rows }))
        .catch(e => {
            console.log(e)
            return {
                statusCode: 500,
                body: {
                    ok: false,
                    error: 'Internal error.'
                }
            }
        })
}

async function router(args) {
  switch (args.httpMethod || '') {
    case 'get': return getRecords(args)
    case 'post': return addRecord(args)
    default: return {
      statusCode: 405,
      body: 'Method not allowed.'
    }
  }
}

module.exports.main = router
