import jwt from "jsonwebtoken";
import ENV from '../config.js'

/*** Auth middleware */

export default async function Auth(req, res, next) {
    try {

        // access authorize header to validate request...
        const token = req.headers.authorization.split(" ")[1];    // split the token by white space becuase token is after bearer .... 

        // retrive the details of logged in user...
        const decodedToken = await jwt.verify(token, ENV.JWT_SECRET);

        req.user = decodedToken;

        // res.json(decodedToken)
        next();

    } catch (error) {
        res.status(401).json({ error: "Authentication error...!" })
    }
}

export function localVariables(req, res, next) {
    req.app.locals = {
        OTP : null ,
        resetSession : false 
    }

    next()
}