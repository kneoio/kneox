const express = require('express');
const path = require('path');
const crypto = require('crypto');
const ejs = require('ejs');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '.env.production')
    : path.join(__dirname, '.env');

console.log(`Loading environment file: ${envFile}`);
dotenv.config({ path: envFile });

const app = express();

console.log('Starting server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`API server: ${process.env.VITE_API_SERVER}`);
console.log(`Organization: ${process.env.ORG_NAME}`);
console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);

let manifest = {};
const manifestPath = path.join(__dirname, 'dist', '.vite', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log('Manifest loaded:', manifest);
} else {
    console.log('Manifest not found');
}

app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    console.log(`Generated nonce: ${res.locals.nonce}`);
    next();
});

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

const templateString = fs.readFileSync(path.join(__dirname, 'template.ejs'), 'utf-8');
const templateFunction = ejs.compile(templateString);

app.get('*', (req, res) => {
    const html = templateFunction({
        nonce: res.locals.nonce,
        title: process.env.ORG_NAME,
        cssFile: manifest['src/main.ts']?.css[0] || '',
        scriptFilename: manifest['src/main.ts']?.file || '',
        apiServer: process.env.VITE_API_SERVER
    });

    res.send(html);
});

const port = process.env.PORT || 8090;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
