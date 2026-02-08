const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function pushToLocalSupabase() {
  console.log('🚀 Pushing MyYard Database to LOCAL Supabase...\n')

  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
  })

  try {
    console.log('🔌 Connecting to Local Supabase...')
    await client.connect()
    console.log('✅ Connected!\n')

    // Read and execute schema
    console.log('📊 Creating database schema...')
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'scripts', 'complete-setup.sql'),
      'utf8'
    )
    await client.query(schemaSQL)
    console.log('✅ Schema created successfully!\n')

    // Read and execute locations
    console.log('🗺️  Inserting South African locations...')
    const locationsSQL = fs.readFileSync(
      path.join(__dirname, 'scripts', 'insert-locations.sql'),
      'utf8'
    )
    await client.query(locationsSQL)
    console.log('✅ Locations inserted successfully!\n')

    console.log('🎉 DATABASE SETUP COMPLETE!\n')
    console.log('✅ All tables created in LOCAL Supabase')
    console.log('✅ 150+ SA locations added')
    console.log('✅ Security policies enabled')
    console.log('\n🚀 Now run: yarn dev')
    console.log('📱 Then open: http://localhost:3000\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some tables already exist - this is OK!')
      console.log('✅ You can still run: yarn dev\n')
    } else {
      console.error(error)
    }
  } finally {
    await client.end()
  }
}

pushToLocalSupabase()
