const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const mainnet = '1';
const dbPath = '../db.sqlite';
const relaysUrl = './relays.json';

const fetchRelays = async () => {
  try {
    const response = await axios.get(relaysUrl);
    const relaysJson = response.data.replace('var relays = ', '').replace(';', '')
    return JSON.parse(relaysJson);
  } catch (error) {
    console.error('Error fetching relays.js file: ', error)
    return [];
  }
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
  const relays = await fetchRelays()
  const allData = await Promise.all(relays.map(fetchDataFromRelay))
  const mergedData = [].concat(...allData)
  await updateLocalDatabase(mergedData)
}

syncRelays()