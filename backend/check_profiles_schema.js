const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkColumns() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `);
        console.log('Columns in profiles:', res.rows.map(r => r.column_name));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkColumns();
