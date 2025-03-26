import fs from 'fs';
import https from 'https';
import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes';
import discord from './discord';
import mongo from './mongo';
import * as config from './config.json';
import { collections, connectToDatabase } from './services/database.service';
import { verifyToken } from './jwt';
import { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { isAuthorized } from './util';

const port = config.port || 8000;

const app = express();

// Load SSL certificate and private key
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/example.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/example.com/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/example.com/chain.pem')
};

https.createServer(options, app).listen(443, () => {
    console.log('secure server running');
});

http.createServer((req, res) => {
    res.writeHead(301, { location: `https://${req.headers['host']}${req.url}` });
    res.end();
}).listen(80, () => {
    console.log('redirecting http to https');
});

// app.set('port', port);
// app.use(routes);
// app.use('/api', discord);

// // connect to the mongo db
// connectToDatabase().then(() => {
//     app.use('/api', isAuthorized, mongo);
// }).catch((error) => {
//     console.error('failed to connect to database', error);
// });

app.get('/', (req: Request, res: Response) => {
    console.log('get /');
    res.end('phlana.moe backend');
});
