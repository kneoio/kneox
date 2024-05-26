import express from 'express';
import path from 'path';
import crypto from 'crypto';
import {fileURLToPath} from 'url';
import fs from 'fs';
import helmet from "helmet";

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

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://www.keypractica.com'],
            styleSrc: ["'self'", 'https://www.keypractica.com'],
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

app.set('view engine', 'ejs');
app.set('views', __dirname);
console.log(`Views directory set to: ${__dirname}`);

const staticPath = path.join(__dirname, 'dist');
app.use('/assets', express.static(staticPath));
console.log(`Static files served from: ${staticPath}`);

app.get('*', (req, res) => {
    const title = "kneox";
    const mainJs = manifest['src/main.ts']?.file || 'fallback.js';
    console.log(`Rendering index.ejs with title: ${title}, nonce: ${res.locals.nonce}, and script: ${mainJs}`);
    res.render('index', {nonce: res.locals.nonce, title, mainJs});
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
