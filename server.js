import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import fs from 'fs';
import helmet from 'helmet';

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
} else {
    console.log('Manifest not found');
}

app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    console.log(`Generated nonce: ${res.locals.nonce}`);
    next();
});

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, 'https://www.keypractica.com'],
            styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, 'https://www.keypractica.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'https:'],
            frameSrc: ["'self'", 'https://auth.keypractica.com'],
            frameAncestors: ["'self'", 'https://auth.keypractica.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
            baseUri: "'self'",
            formAction: "'self'"
        },
        reportOnly: false,
    })
);

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

app.get('*', (req, res) => {
    const htmlPath = path.join(__dirname, 'dist', 'index.html');
    fs.readFile(htmlPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Inject nonce into script and style tags
        const nonce = res.locals.nonce;
        const htmlWithNonce = data
            .replace(/<script /g, `<script nonce="${nonce}" `)
            .replace(/<style /g, `<style nonce="${nonce}" `);

        res.send(htmlWithNonce);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
