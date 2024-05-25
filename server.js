import express from 'express';
import path from 'path';
import helmet from 'helmet';
import crypto from 'crypto';
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
            scriptSrc: ["'self'", `'nonce-${res.locals.nonce}'`, "'strict-dynamic'"],
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

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/config', (req, res) => {
    const config = {
        "realm": process.env.KEYPRACTICA_REALM,
        "auth-server-url": process.env.KEYPRACTICA_AUTH_SERVER_URL,
        "resource": process.env.KEYPRACTICA_RESOURCE,
        "client-realm": "semantyca.com"
    };
    res.json(config);
});

app.get('*', (req, res) => {
    res.render('index', { nonce: res.locals.nonce });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
