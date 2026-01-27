const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

console.log('Keys in .env:');
Object.keys(envConfig).forEach(key => console.log(key));
