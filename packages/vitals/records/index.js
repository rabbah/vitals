const mysql = require('mysql2/promise')
const { readFileSync } = require('fs')

function init() {
    const dbclient = mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            ca: readFileSync(__dirname + '/ca-certificate.crt')
        }
    })

    if (false) {
        delete process.env.DB_HOST
        delete process.env.DB_PORT
        delete process.env.DB_USER
        delete process.env.DB_PASSWORD
        delete process.env.DB_NAME
        delete process.env.DB_CERT
    }

    return dbclient
}

function isNumeric(args, field, floatOK = false) {
    let val = args[field]
    if (typeof (val) === 'string') {
        try {
            val = floatOK ? parseFloat(val) : parseInt(val)
        } catch (e) {
            val = undefined
        }
    }

    if (Number.isInteger(val) || (floatOK && !isNaN(val))) {
        return Promise.resolve(val)
    } else {
        return Promise.reject(`${field} is not a valid numeric value`)
    }
}

async function initTable(connection) {
    return connection.query(
        `CREATE TABLE IF NOT EXISTS vitals (
               record_id INT AUTO_INCREMENT PRIMARY KEY,
               pulse TINYINT,
               bp_systolic TINYINT,
               bp_diastolic TINYINT,
               glucose_level DECIMAL (5,2),
               created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )  ENGINE=INNODB;`
    )
}

async function addRecord(connection, args) {
    let pulse = 0, bp_systolic = 0, bp_diastolic = 0, glucose_level = 0
    try {
        await Promise.all([
            isNumeric(args, 'pulse').then(_ => pulse = _),
            isNumeric(args, 'bp_systolic').then(_ => bp_systolic = _),
            isNumeric(args, 'bp_diastolic').then(_ => bp_diastolic = _),
            isNumeric(args, 'glucose_level', true).then(_ => glucose_level = _.toFixed(2))
        ])
    } catch (e) {
        return Promise.reject(e)
    }

    return connection.query(
        `INSERT INTO vitals(pulse, bp_systolic, bp_diastolic, glucose_level)
             VALUES (${pulse}, ${bp_systolic}, ${bp_diastolic}, ${glucose_level})`
    )
}

async function getRecords(connection, args) {
    return connection.query(`SELECT * FROM vitals;`)
}

function handleError(e) {
    console.log(e)
    return {
        body: {
            ok: false,
            error: e.message || e
        }
    }
}

async function router(dbclient, args) {
    const method = (args.httpMethod || 'get').toLowerCase()
    switch (method) {
        case 'patch':
            return dbclient.then(async connection => {
                let res = await initTable(connection)
                return { body: res }
            }).catch(handleError)
        case 'get':
            return dbclient.then(async connection => {
                let [rows, fields] = await getRecords(connection, args)
                return { body: rows }
            }).catch(handleError)
        case 'post':
            return dbclient.then(async connection => {
                let [rows, fields] = await addRecord(connection, args)
                return {
                    statusCode: 303,
                    headers: {
                        location: `/diary.html`
                    }
                }
            }).catch(handleError)
        default: return {
            statusCode: 405,
            body: 'Method not allowed.'
        }
    }
}

module.exports.main = (() => {
    if (process.env.TEST) {
        require('dotenv').config()
    }

    const dbclient = init()
    return (args) => router(dbclient, args)
})()

if (process.env.TEST) {
    module.exports.main({ httpMethod: 'patch' }).then(console.log).catch(console.log)
    module.exports.main({ httpMethod: 'get' }).then(console.log).catch(console.log)
    module.exports.main({ httpMethod: 'post', pulse: 60, bp_systolic: 100, bp_diastolic: 60, glucose_level: 100.30 }).then(console.log).catch(console.log)
    module.exports.main({ httpMethod: 'get' }).then(console.log).catch(console.log)
}
