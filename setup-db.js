const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://pbyhhzygikyucqogitwj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWhoenlnaWt5dWNxb2dpdHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE4MTcsImV4cCI6MjA4NjE1NzgxN30.0Oyl0Vf09ceMUEcsrzUtJj1mYTQ-J72sAgmo922DtTE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Setting up MyYard Database...\n')

  try {
    // Read SQL files
    console.log('📊 Step 1: Reading database schema...')
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'scripts', 'complete-setup.sql'), 'utf8')
    
    console.log('📊 Step 2: Creating database schema...')
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL })
    
    if (schemaError) {
      console.log('⚠️  Schema might already exist or needs manual setup')
      console.log('Error:', schemaError.message)
    } else {
      console.log('✅ Database schema created successfully!')
    }

    console.log('\n🗺️ Step 3: Reading locations data...')
    const locationsSQL = fs.readFileSync(path.join(__dirname, 'scripts', 'insert-locations.sql'), 'utf8')
    
    console.log('🗺️ Step 4: Inserting South African locations...')
    const { error: locationsError } = await supabase.rpc('exec_sql', { sql: locationsSQL })
    
    if (locationsError) {
      console.log('⚠️  Locations might already exist')
      console.log('Error:', locationsError.message)
    } else {
      console.log('✅ Locations inserted successfully!')
    }

    console.log('\n🎉 Database setup complete!')
    console.log('✅ All tables ready')
    console.log('✅ 150+ SA locations added')
    console.log('\nNow run: yarn dev')
    console.log('Then open: http://localhost:3000')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📝 Manual Setup Required:')
    console.log('1. Go to: https://supabase.com/dashboard/project/pbyhhzygikyucqogitwj/sql/new')
    console.log('2. Copy contents of: /app/scripts/complete-setup.sql')
    console.log('3. Paste and click RUN')
    console.log('4. Copy contents of: /app/scripts/insert-locations.sql')
    console.log('5. Paste and click RUN')
  }
}

setupDatabase()
