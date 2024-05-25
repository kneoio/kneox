import express from 'express';
import path from 'path';
import helmet from 'helmet';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const isDevelopment = process.env.NODE_ENV === 'development';

const cspDirectives = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        frameSrc: ["'self'", isDevelopment ? "http://localhost:8090" : "https://auth.keypractica.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
    },
};

app.use(helmet.contentSecurityPolicy(cspDirectives));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'narseler'));
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
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
