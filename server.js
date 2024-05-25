import express from 'express';
import path from 'path';
import helmet from 'helmet';
import crypto from 'crypto';
import {fileURLToPath} from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isDevelopment = process.env.NODE_ENV === 'development';

console.log('Starting server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);

let manifest = {};
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log('Manifest loaded:', manifest);
}

// Middleware to generate a nonce and add it to res.locals
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    console.log(`Generated nonce: ${res.locals.nonce}`);
    next();
});

// CSP configuration with nonce
app.use((req, res, next) => {
    console.log('Setting CSP headers');
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", `'nonce-${res.locals.nonce}'`, 'https://www.keypractica.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://www.keypractica.com'],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:"],
            frameSrc: ["'self'", isDevelopment ? "http://localhost:8090" : "https://auth.keypractica.com"],
            frameAncestors: ["'self'", "http://localhost:8090", "https://auth.keypractica.com"], // Added this line
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    })(req, res, next);
});

// Set EJS as the view engine and set the views directory to the current directory
app.set('view engine', 'ejs');
app.set('views', __dirname); // Views directory set to current directory
console.log(`Views directory set to: ${__dirname}`);

// Serve static files from the 'dist' directory
const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
console.log(`Static files served from: ${staticPath}`);

// Serve the HTML file with injected nonce and dynamic title
app.get('*', (req, res) => {
    const title = "kneox"; // Set your dynamic title here
    const mainJs = manifest['src/main.ts']?.file || 'assets/index-qhnKbt7S.js'; // Default fallback
    console.log(`Rendering index.ejs with title: ${title}, nonce: ${res.locals.nonce}, and script: ${mainJs}`);
    res.render('index', { nonce: res.locals.nonce, title, mainJs });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
