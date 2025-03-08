const express = require('express');
const path = require('path');
const crypto = require('crypto');
const ejs = require('ejs');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables based on environment
const envFile = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '.env.production')
    : path.join(__dirname, '.env');

dotenv.config({ path: envFile });

const app = express();

// Minimal startup logging
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`API server: ${process.env.VITE_API_SERVER}`);

// Load Vite manifest for asset paths
let manifest = {};
const manifestPath = path.join(__dirname, 'dist', '.vite', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
} else {
    console.log('Manifest not found');
}

// Generate security nonce for each request
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// We're only serving static files that Nginx might miss or can't be configured to serve
// In production, you should configure Nginx to serve all static content from 'dist'
// This is just a fallback
app.use(express.static(path.join(__dirname, 'dist')));

// Load and compile template once on startup
let templateFunction;
try {
    const templateString = fs.readFileSync(path.join(__dirname, 'template.ejs'), 'utf-8');
    templateFunction = ejs.compile(templateString);
} catch (error) {
    console.error('Error loading template:', error);
    process.exit(1);
}

// Handle all routes by rendering the template with dynamic values
app.get('*', (req, res) => {
    try {
        const html = templateFunction({
            nonce: res.locals.nonce,
            title: process.env.ORG_NAME,
            cssFile: manifest['src/main.ts']?.css[0] || '',
            scriptFilename: manifest['src/main.ts']?.file || '',
            apiServer: process.env.VITE_API_SERVER
        });

        res.send(html);
    } catch (error) {
        console.error('Error rendering template:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add a simple health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const port = process.env.PORT || 8090;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});