const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const mainnet = '1';
const dbPath = '../db.sqlite';
const relaysUrl = 'https://raw.githubusercontent.com/Spl0itable/backend_invoices/main/src/relays.json';

async function fetchRelays(relayUrl) {
    return new Promise(async (resolve) => {
      try {
        const response = await axios.get(relayUrl)
        // Use response.data directly without calling JSON.parse()
        resolve(response.data)
      } catch (error) {
        console.error('Error fetching relays.json file:', error)
        resolve([])
      }
    })
  }

const fetchDataFromRelay = async (relay) => {
  try {
    const response = await axios.post(`${relay.name}/invoice/fetchmany/`, { mainnet })
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${relay.name}: `, error)
    return [];
  }
}

const getTableColumns = async (db) => {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info('invoices')", [], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        const columns = rows.map((row) => row.name)
        resolve(columns)
      }
    })
  })
}

const updateLocalDatabase = async (rows) => {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message)
    }
  })

  const columns = await getTableColumns(db)

  const updateOrInsertRow = (row) => {
    const rowColumns = columns.filter((column) => row[column] !== undefined)
    const values = rowColumns
      .map((column) => `'${row[column]}'`)
      .join(', ')

    const updateFields = rowColumns.map((column) => `${column} = EXCLUDED.${column}`).join(', ')

    const sql = `
      INSERT INTO invoices (${rowColumns.join(', ')})
      VALUES (${values})
      ON CONFLICT (uniqhash) DO UPDATE SET ${updateFields}
    `;

    db.run(sql, (err) => {
      if (err) {
        console.error('Error updating row: ', err.message)
      }
    })
  }

  rows.forEach(updateOrInsertRow)

  db.close()
}

const syncRelays = async () => {
    const relays = await fetchRelays(relaysUrl) // Pass relaysUrl as a parameter
    const allData = await Promise.all(relays.map(fetchDataFromRelay))
    const mergedData = [].concat(...allData)
    await updateLocalDatabase(mergedData)
  }

syncRelays()