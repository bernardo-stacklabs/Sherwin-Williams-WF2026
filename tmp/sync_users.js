const { createClient } = require('@supabase/supabase-js');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase (extraídas do app.js)
const supabaseUrl = 'https://kjwlboqqdufrkhcxjppf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqd2xib3FxZHVmcmtoY3hqcHBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMyOTU2OCwiZXhwIjoyMDc4OTA1NTY4fQ.t30eEhmv9uVv-FEDoDKKwrgb6lfj6NUYEnTl47bydsw';
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    },
    global: {
        fetch
    }
});

async function syncUsers() {
    console.log('Iniciando sincronização de usuários...');

    // Lendo o arquivo participantes.js
    const filePath = path.join(__dirname, '..', 'assets', 'data', 'participantes.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Extraindo o array de objetos (removendo a exportação do JS para dar parse como JSON)
    const jsonString = fileContent
        .replace('export const participantesData = ', '')
        .replace(/;$/, '')
        .trim();

    let participantes;
    try {
        participantes = JSON.parse(jsonString);
    } catch (e) {
        console.error('Erro ao processar participantes.js. Verifique o formato JSON.', e);
        return;
    }

    console.log(`Encontrados ${participantes.length} participantes.`);

    for (const p of participantes) {
        const email = p.E_MAIL;
        const nome = p.__EMPTY || p.NOME_COMP;
        const senha = p.CPF ? p.CPF.toString() : 'Sherwin2026!'; // Usando CPF como senha conforme discutido

        if (!email || !email.includes('@')) {
            console.warn(`Pulando participante sem e-mail válido: ${nome}`);
            continue;
        }

        console.log(`Sincronizando: ${email} (${nome})`);

        // Upsert na tabela users baseada no email
        const { data, error } = await supabase
            .from('users')
            .upsert({
                email: email.toLowerCase(),
                password: senha,
                name: nome
            }, { onConflict: 'email' });

        if (error) {
            console.error(`Erro ao sincronizar ${email}:`, error.message);
        } else {
            console.log(`Sucesso: ${email}`);
        }
    }

    console.log('Sincronização concluída!');
}

syncUsers();
