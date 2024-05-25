import express from 'express';
import path from 'path';
import crypto from 'crypto';
import {fileURLToPath} from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

console.log('Starting server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);

let manifest = {};
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log('Manifest loaded:', manifest);
}

app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    console.log(`Generated nonce: ${res.locals.nonce}`);
    next();
});

app.use((req, res, next) => {
    console.log('Setting CSP headers manually');
    res.setHeader("Content-Security-Policy", `default-src 'self'; script-src 'self' 'nonce-${res.locals.nonce}' https://www.keypractica.com; style-src 'self' 'unsafe-inline' https://www.keypractica.com; img-src 'self' data:; connect-src 'self'; font-src 'self' https:; frame-src 'self' https://auth.keypractica.com; frame-ancestors 'self' https://auth.keypractica.com; object-src 'none'; upgrade-insecure-requests; base-uri 'self'; form-action 'self';`);
    next();
});

app.use((req, res, next) => {
    res.setHeader('X-Custom-Header', 'CSP-Updated');
    next();
});

// Set EJS as the view engine and set the views directory to the current directory
app.set('view engine', 'ejs');
app.set('views', __dirname); // Views directory set to current directory
console.log(`Views directory set to: ${__dirname}`);

// Serve static files from the 'dist' directory
const staticPath = path.join(__dirname, 'dist');
app.use('/assets', express.static(staticPath)); // Ensure correct path
console.log(`Static files served from: ${staticPath}`);

// Serve the HTML file with injected nonce and dynamic title
app.get('*', (req, res) => {
    const title = "kneox"; // Set your dynamic title here
    const mainJs = manifest['src/main.ts']?.file || 'assets/index-qhnKbt7S.js'; // Default fallback
    console.log(`Rendering index.ejs with title: ${title}, nonce: ${res.locals.nonce}, and script: ${mainJs}`);
    res.render('index', {nonce: res.locals.nonce, title, mainJs});
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
