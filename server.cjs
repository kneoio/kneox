const express = require('express');
const path = require('path');
const crypto = require('crypto');
const ejs = require('ejs');
const fs = require('fs');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

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
    console.log('✅ Manifest loaded successfully');
} else {
    console.log('❌ Manifest not found at:', manifestPath);
}

const apiServer = process.env.VITE_API_SERVER;
if (apiServer) {
    app.use('/api', createProxyMiddleware({
        target: apiServer,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[PROXY] Forwarding request: ${req.method} ${req.url} -> ${apiServer}${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('[PROXY] Error:', err);
            if (!res.headersSent) {
                res.status(500).send('Proxy error');
            }
        }
    }));
} else {
    console.error('VITE_API_SERVER is not defined. API proxy will not be configured.');
}

app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Serve static files with proper MIME types BEFORE other routes
app.use('/assets', express.static(path.join(__dirname, 'dist/assets'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serve other static files
app.use(express.static(path.join(__dirname, 'dist'), {
    index: false // Don't serve index.html automatically
}));

let templateFunction;
try {
    const templateString = fs.readFileSync(path.join(__dirname, 'template.ejs'), 'utf-8');
    templateFunction = ejs.compile(templateString);
} catch (error) {
    console.error('Error loading template:', error);
    process.exit(1);
}

// Health check route BEFORE catch-all
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Only serve template for non-asset requests
app.get('*', (req, res) => {
    // Skip template for asset requests - return 404 instead
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/)) {
        console.log(`❌ Asset not found: ${req.url}`);
        return res.status(404).send('Asset not found');
    }

    try {
        const html = templateFunction({
            nonce: res.locals.nonce,
            title: process.env.ORG_NAME,
            cssFile: manifest['style.css']?.file || '',
            scriptFilename: manifest['index.html']?.file || '',
            apiServer: process.env.VITE_API_SERVER,
            streamServer: process.env.VITE_STREAM_SERVER || 'http://localhost:38707'
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
    console.log(`Manifest entries:`, Object.keys(manifest));
});