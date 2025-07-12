const express = require('express');
const path = require('path');
const crypto = require('crypto');
const ejs = require('ejs');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '.env.production')
    : path.join(__dirname, '.env');

dotenv.config({ path: envFile });

const app = express();

console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`API server: ${process.env.VITE_API_SERVER}`);

let manifest = {};
const manifestPath = path.join(__dirname, 'dist', '.vite', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
} else {
    console.log('Manifest not found');
}

app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

let templateFunction;
try {
    const templateString = fs.readFileSync(path.join(__dirname, 'template.ejs'), 'utf-8');
    templateFunction = ejs.compile(templateString);
} catch (error) {
    console.error('Error loading template:', error);
    process.exit(1);
}

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('*', (req, res) => {
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/)) {
        return res.status(404).send('Asset not found');
    }

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

const port = process.env.PORT || 8090;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});