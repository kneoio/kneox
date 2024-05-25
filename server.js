import express from 'express';
import path from 'path';
import helmet from 'helmet';
import crypto from 'crypto';
import fs from 'fs';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isDevelopment = process.env.NODE_ENV === 'development';

// Middleware to generate a nonce and add it to res.locals
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// CSP configuration with nonce
app.use((req, res, next) => {
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", `'nonce-${res.locals.nonce}'`],
            scriptSrcElem: ["'self'", 'https://www.keypractica.com'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:"],
            frameSrc: ["'self'", isDevelopment ? "http://localhost:8090" : "https://auth.keypractica.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    })(req, res, next);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the HTML file with injected nonce
app.get('*', (req, res) => {
    fs.readFile(path.join(__dirname, 'dist', 'index.html'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading index.html');
        }
        const nonce = res.locals.nonce;
        const updatedData = data.replace('<script type="module" src="/src/main.ts"></script>', `<script type="module" nonce="${nonce}" src="/src/main.ts"></script>`);
        res.send(updatedData);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
