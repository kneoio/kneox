const express = require('express');
const path = require('path');
const crypto = require('crypto');
const ejs = require('ejs');
const helmet = require('helmet');
const fs = require('fs');

const app = express();

console.log('Starting server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
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

/*
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
);*/

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

const templateString = fs.readFileSync(path.join(__dirname, 'template.ejs'), 'utf-8');
const templateFunction = ejs.compile(templateString);

app.get('*', (req, res) => {
    const html = templateFunction({
        nonce: res.locals.nonce,
        title: process.env.ORG_NAME,
        cssFile: manifest['src/main.ts']?.css[0] || '',
        scriptFilename: manifest['src/main.ts']?.file || ''
    });

    res.send(html);
});

const port = process.env.PORT || 8090;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
