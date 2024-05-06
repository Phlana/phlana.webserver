import jwt from 'jsonwebtoken';
import config from './config.json';

export const generateToken = (code: string): string => {
    return jwt.sign({ code }, config.jwt_secret_key, { expiresIn: '1h' });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, config.jwt_secret_key);
};
