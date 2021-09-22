import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv/config" ;
import {router} from './routes/user.js';
import {otpRouter} from './routes/otp.js';
import cookieParser from "cookie-parser"
const app = express();
const PORT = process.env.PORT||5000;
//MongoDB url
const URL = process.env.URL;
// Connecting our app to mongoDB
mongoose.connect(URL, { useNewUrlParser: true ,useUnifiedTopology: true});
const con = mongoose.connection;
con.on("open", () => console.log("MongoDB is connected"));

app.get('/',(request,response)=>{
    response.send("Welcome to gdrive backend");
})

app.use(express.json());
app.use(cookieParser());
// const allowedOrigins = "https://google-drive-ak-front-end.netlify.app" || "http://localhost:3000" ;
// app.use(cors({credentials:true,origin:allowedOrigins}));
app.use(function (req, res, next) {

  var allowedDomains = ['http://localhost:3000','https://google-drive-ak-front-end.netlify.app' ];
  var origin = req.headers.origin;
  if(allowedDomains.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
})

app.use("/user",router);
app.use("/otp",otpRouter);
app.listen(PORT,() => console.log("Server started at "+ PORT));
