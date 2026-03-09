
const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL || 'https://pffbpufjovqlxzogrtjl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmJwdWZqb3ZxbHh6b2dydGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQyOTAsImV4cCI6MjA4ODYwMDI5MH0.kckgDcj2PR9n7xDmiVqIk19ym6zdgUfkPBUEWpl_AwI';

const targetEmail = 'quetsia.s.menegazzo@sherwin.com.br';

function log(msg) {
    console.log(`[DEBUG] ${msg}`);
}

async function runTest() {
    log(`Checking details for: ${targetEmail}`);
    const urlAll = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}&select=id,email,password,created_at`;

    await fetchRequest(urlAll, (data) => {
        log(`Records found: ${data.length}`);
        data.forEach((u, i) => {
            log(`ROW ${i}:`);
            log(`  ID: ${u.id}`);
            log(`  Created: ${u.created_at}`);
            log(`  Password: ${u.password}`);
        });
    });
}

function fetchRequest(url, callback) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    callback(json);
                    resolve();
                } catch (e) {
                    log('Error parsing JSON response');
                    resolve();
                }
            });
        }).on('error', (err) => {
            log('Request Error: ' + err.message);
            resolve();
        });
    });
}

runTest();
