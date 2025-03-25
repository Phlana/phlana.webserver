import express, { RequestHandler } from 'express';
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

const allowedOrigins = ['https://phlana.moe'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            console.log('allowed', origin);
            callback(null, true);
        }
        else {
            console.log('not allowed', origin);
            callback(new Error('not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.set('port', port);
app.use(routes);
app.use('/api', discord);

// connect to the mongo db
connectToDatabase().then(() => {
    app.use('/api', isAuthorized, mongo);
}).catch((error) => {
    console.error('failed to connect to database', error);
});

app.listen(app.get('port'), () => {
    console.log(`server started on http://localhost:${port}`);
});
