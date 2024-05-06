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
app.use(cors());
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
