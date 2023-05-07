const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const mainnet = '1';
const dbPath = '../db.sqlite';
const relaysUrl = 'https://fleek.ipfs.io/ipfs/QmWdpftgzRJ3MUwBGm9g1XQPcuou2qEev36MokZ3mbKSd7/src/relays.json';

const escapeSingleQuotes = (value) => {
    if (typeof value === 'string') {
      return value.replace(/'/g, "''")
    }
    return value;
  }

async function fetchRelays(relayUrl) {
  try {
    const response = await axios.get(relayUrl)
    return response.data;
  } catch (error) {
    console.error('Error fetching relays.json file:', error)
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
    return new Promise((resolve, reject) => {
      const rowColumns = columns.filter((column) => column !== 'id' && row[column] !== undefined)
  
      if (rowColumns.length > 0) {
        const values = rowColumns.map((column) => `'${escapeSingleQuotes(row[column])}'`).join(', ')
        const updateFields = rowColumns.map((column) => `${column} = '${escapeSingleQuotes(row[column])}'`).join(', ')
  
        db.get(`SELECT * FROM invoices WHERE uniqhash = ?`, [row.uniqhash], (err, existingRow) => {
          if (existingRow) {
            // Row with the same uniqhash already exists, update the row
            const updateSql = `
              UPDATE invoices
              SET ${updateFields}
              WHERE uniqhash = '${row.uniqhash}';
            `;
  
            db.run(updateSql, (err) => {
              if (err) {
                console.error('Error updating row: ', err.message)
                reject(err)
              } else {
                resolve()
              }
            })
          } else {
            // No row with the same uniqhash, insert the row
            const insertSql = `
              INSERT INTO invoices (${rowColumns.join(', ')})
              VALUES (${values});
            `;
  
            db.run(insertSql, (err) => {
              if (err) {
                console.error('Error inserting row: ', err.message)
                reject(err)
              } else {
                resolve()
              }
            })
          }
        })
      } else {
        console.warn('Skipping row with no matching columns:', row)
        resolve()
      }
    })
  }

  await Promise.all(rows.map(updateOrInsertRow))

  db.close()
}

const syncRelays = async () => {
  const relays = await fetchRelays(relaysUrl)
  const allResponses = await Promise.all(relays.map(fetchDataFromRelay))
  const mergedData = allResponses
  .map(response => response.items)
  .flat();
  await updateLocalDatabase(mergedData)
}

syncRelays()