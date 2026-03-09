const { createClient } = require('@supabase/supabase-js');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase (extraídas do app.js)
const supabaseUrl = process.env.SUPABASE_URL || 'https://pffbpufjovqlxzogrtjl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmJwdWZqb3ZxbHh6b2dydGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQyOTAsImV4cCI6MjA4ODYwMDI5MH0.kckgDcj2PR9n7xDmiVqIk19ym6zdgUfkPBUEWpl_AwI';
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

    // 1. Limpeza total da tabela (conforme pedido pelo usuário)
    console.log('Limpando tabela users...');
    const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .neq('id', 0); // Deleta tudo (inclui linhas com email NULL)

    if (deleteError) {
        console.error('Erro ao limpar tabela:', deleteError.message);
        return;
    }
    console.log('Tabela limpa com sucesso.');

    // 2. Lendo o arquivo participantes.js
    const filePath = path.join(__dirname, '..', 'assets', 'data', 'participantes.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Extraindo o array de objetos
    const jsonString = fileContent
        .replace('export const participantesData = ', '')
        .replace(/;$/, '')
        .trim();

    let participantes;
    try {
        participantes = JSON.parse(jsonString);
    } catch (e) {
        console.error('Erro ao processar participantes.js. Verificação manual necessária.', e);
        return;
    }

    console.log(`Encontrados ${participantes.length} no arquivo bruto. Preparando carga...`);

    const uniqueParticipantes = new Map();
    const passwordDefault = 'Sherwin2026@';

    for (const p of participantes) {
        const rawEmail = (p.E_MAIL || '').toString().trim();
        const email = rawEmail ? rawEmail.toLowerCase() : null;
        const nome = (p.NOME_COMP || p.__EMPTY || 'Participante').toString().trim();

        // Dedup key: prefer e-mail; fallback to a stable synthetic key so we still insert rows without e-mail.
        const dedupKey = email && email.includes('@')
            ? `email:${email}`
            : `noemail:${(p['ID CLOUD'] ?? p.ID ?? p.QTD ?? nome)}`;

        if (!uniqueParticipantes.has(dedupKey)) {
            uniqueParticipantes.set(dedupKey, {
                email: (email && email.includes('@')) ? email : null,
                password: passwordDefault,
                name: nome
            });
        }
    }

    console.log(`Pronto para inserir ${uniqueParticipantes.size} usuários.`);

    for (const [key, userData] of uniqueParticipantes) {
        console.log(`Inserindo: ${userData.email || key} (${userData.name})`);

        const { error } = await supabase
            .from('users')
            .insert(userData);

        if (error) {
            console.error(`Erro ao inserir ${email}:`, error.message);
        }
    }

    console.log('Sincronização concluída!');
}

syncUsers();
