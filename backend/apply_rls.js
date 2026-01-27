const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase usually requires SSL
    });

    try {
        await client.connect();

        const sqlPath = path.resolve('C:/Users/Burhan/Documents/biggest project/fix_marksheets_table_rls.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL...');
        await client.query(sql);
        console.log('SQL applied successfully.');

    } catch (err) {
        console.error('Error applying SQL:', err);
    } finally {
        await client.end();
    }
}

run();
