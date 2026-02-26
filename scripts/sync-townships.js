const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://ffkvytgvdqipscackxyg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma3Z5dGd2ZHFpcHNjYWNreHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mjc2NDksImV4cCI6MjA4NzUwMzY0OX0.dVc6jytRfs3FFmk_oWMMJnI-sOH7Uz_LdAjcBiK2ukM';

// Parse static townships from TypeScript file
function parseStaticTownships() {
  const content = fs.readFileSync('./lib/data/townships.ts', 'utf8');
  const townships = [];
  const regex = /\{\s*name:\s*"([^"]+)",\s*city:\s*"([^"]+)",\s*province:\s*"([^"]+)",\s*type:\s*"([^"]+)"\s*\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    townships.push({ name: match[1], city: match[2], province: match[3], type: match[4] });
  }
  return townships;
}

function supabaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=merge-duplicates'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const staticTownships = parseStaticTownships();
  console.log(`Parsed ${staticTownships.length} townships from static data`);

  // Get existing townships
  const existing = await supabaseRequest('GET', '/rest/v1/townships?select=name,city&limit=500');
  const existingNames = new Set(JSON.parse(existing.data).map(t => `${t.name}|${t.city}`));
  console.log(`Found ${existingNames.size} existing townships in database`);

  // Find missing
  const missing = staticTownships.filter(t => !existingNames.has(`${t.name}|${t.city}`));
  console.log(`Need to insert ${missing.length} missing townships`);

  // Insert in batches of 50
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50).map(t => ({
      name: t.name,
      city: t.city,
      province: t.province,
      type: t.type,
      is_active: true
    }));
    const result = await supabaseRequest('POST', '/rest/v1/townships', batch);
    console.log(`Batch ${Math.floor(i/50)+1}: inserted ${batch.length} records (status: ${result.status})`);
    if (result.status >= 400) {
      console.error('Error:', result.data);
    }
  }

  // Verify final count
  const finalCount = await supabaseRequest('GET', '/rest/v1/townships?select=count&limit=1');
  console.log(`Final count: ${JSON.parse(finalCount.data)[0].count} townships`);
}

main().catch(console.error);
