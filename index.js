import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv/config" ;
import {router} from './routes/user.js';
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
app.use(cors({credentials:true,origin:"https://google-drive-ak-front-end.netlify.app"}));

app.use("/user",router);
app.listen(PORT,() => console.log("Server started at "+ PORT));
