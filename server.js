import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

app.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
});
