import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import {router} from './routes/user.js';
const app = express();
const PORT = process.env.PORT||5000;
//MongoDB url
const URL = process.env.URL;
// Connecting our app to mongoDB
mongoose.connect(URL, { useNewUrlParser: true });
const con = mongoose.connection;
con.on("open", () => console.log("MongoDB is connected"));

app.get('/',(request,response)=>{
    response.send("Welcome to gdrive backend");
})

app.use(express.json());

app.use(cors());

app.use("/",router);
app.listen(PORT,() => console.log("Server started at "+ PORT));
