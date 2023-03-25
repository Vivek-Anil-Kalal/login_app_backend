// jshint esversion:6
import express from "express";
import cors from "cors"
import morgan from "morgan";
import connect from "./database/conn.js";
import router from "./router/route.js";
import bodyParser from 'body-parser'

const app = express();
/** middleware */
app.use(express.json())
app.use(cors())
app.use(morgan('tiny'))
app.disable('x-powered-by') // less hackers know about our stack

/** Increasing Limit for image uploading */
// app.use(bodyParser.json({ limit: '50MB' }));
// app.use(bodyParser.urlencoded({ limit: '50MB', extended: true }));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

const port = process.env.PORT || 8080;

/*** HTTP GET Request */
app.get("/", (req, res) => {
    res.status(201).json("Home GET Request")
})


/*** api routes */

app.use("/api" , router )

/*** Start Server only when we have valid connection*/

connect().then(() => {
    try {
        app.listen(port, () => {
            console.log(`Server Connected to http://localhost:${port}`);
        })
    } catch (error) {
        console.log("Cannot Connect to Database");
    }
}).catch( error => {
    console.log("Invalid Connection to database");
})

