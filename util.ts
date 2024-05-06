import { RequestHandler } from "express";
import { JwtPayload, JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { verifyToken } from "./jwt";
import { collections } from "./services/database.service";

export const getErrorMessage = (error: any) => {
    if (error instanceof Error) return error.message;
    return String(error);
};

export const isAuthorized: RequestHandler = async (req, res, next) => {
    // console.log(req.headers.authorization);
    try {
        var result: JwtPayload = verifyToken(req.headers.authorization) as JwtPayload;
        // console.log(result);
        // check db for discord token
        var r = await collections.codes.findOne({code: result.code});
        // code not in database, invalid
        if (!r) throw new JsonWebTokenError("token is not valid");
    }
    catch (error) {
        if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
            console.log("token invalid")
            // token has expired, or invalid
            return res.status(401).end();
        }
    }
    
    next();
};
