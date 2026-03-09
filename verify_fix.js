
const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL || 'https://pffbpufjovqlxzogrtjl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmJwdWZqb3ZxbHh6b2dydGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQyOTAsImV4cCI6MjA4ODYwMDI5MH0.kckgDcj2PR9n7xDmiVqIk19ym6zdgUfkPBUEWpl_AwI';

const targetEmail = 'quetsia.s.menegazzo@sherwin.com.br';
const targetPassword = 'sw2026';

function log(msg) {
    console.log(`[VERIFY] ${msg}`);
}

// Simulate app.js: .eq('email', email).eq('password', password).maybeSingle()
function runVerify() {
    // using "limit=2" to check if more than 1 are returned, although maybeSingle logic is client side in app.js.
    // In raw REST, we just check if we get exactly 1 record.
    const url = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}&password=eq.${encodeURIComponent(targetPassword)}&select=id,email`;

    const options = {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
        }
    };

    https.get(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(body);
                if (json.length === 1) {
                    log('SUCCESS: Exactly one user returned. Login will work.');
                    log(`User ID: ${json[0].id}`);
                } else if (json.length > 1) {
                    log(`FAILURE: Still duplicate users found! Count: ${json.length}`);
                } else {
                    log('FAILURE: No user found (credentials wrong?)');
                }
            } catch (e) {
                log('Error parsing JSON');
            }
        });
    }).on('error', (err) => {
        log('Error: ' + err.message);
    });
}

runVerify();
