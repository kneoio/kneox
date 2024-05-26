import express from 'express';
import path from 'path';
import crypto from 'crypto';
import {fileURLToPath} from 'url';
import fs from 'fs';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

console.log('Starting server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
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

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://www.keypractica.com', (req, res) => `'nonce-${res.locals.nonce}'`],
            styleSrc: ["'self'", 'https://www.keypractica.com', (req, res) => `'nonce-${res.locals.nonce}'`],
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
        reportUri: ''
    })
);

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

app.get(['/', '/index.html'], (req, res) => {
    const title = 'kneox';
    const mainJs = manifest['src/main.ts']?.file;
    const mainCss = manifest['src/main.ts']?.css[0]; // Always assume the CSS file is present

    if (mainJs && mainCss) {
        app.set('view engine', 'ejs');
        app.set('views', __dirname);
        console.log(`Views directory set to: ${__dirname}`);
        console.log(`Rendering index.ejs with title: ${title}, nonce: ${res.locals.nonce}, script: ${mainJs}, and style: ${mainCss}`);
        res.render('index', { nonce: res.locals.nonce, title, mainJs, mainCss });
    } else {
        console.error('Main script or CSS not found in manifest.');
        res.status(500).send('Internal Server Error');
    }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
