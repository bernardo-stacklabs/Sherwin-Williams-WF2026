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

    // 1. Limpeza total da tabela (conforme pedido pelo usuário)
    console.log('Limpando tabela users...');
    const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .neq('email', 'admin@example.com'); // Deleta tudo exceto um possível admin se houver, ou apenas .neq('id', 0) para deletar tudo

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

    console.log(`Encontrados ${participantes.length} no arquivo bruto. Deduplicando...`);

    const uniqueParticipantes = new Map();
    const passwordDefault = 'Sherwin2026!';

    for (const p of participantes) {
        const email = (p.E_MAIL || '').toLowerCase().trim();
        const nome = (p.NOME_COMP || p.__EMPTY || 'Participante').trim();

        if (!email || !email.includes('@')) continue;

        // Se o e-mail já existe, mantemos o primeiro encontrado (ou o que tiver mais dados se necessário)
        if (!uniqueParticipantes.has(email)) {
            uniqueParticipantes.set(email, {
                email: email,
                password: passwordDefault,
                name: nome
            });
        }
    }

    console.log(`Pronto para inserir ${uniqueParticipantes.size} participantes únicos.`);

    for (const [email, userData] of uniqueParticipantes) {
        console.log(`Inserindo: ${email} (${userData.name})`);

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
