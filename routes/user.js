import bcrypt from "bcrypt";
import dotenv from "dotenv/config";
import multer from "multer";
import AWS from "aws-sdk";
import uuid from "uuid";
import express, { request, response } from "express";
import {User} from '../models/signupschema.js';
import {auth} from '../middleware/auth.js';
import jwt from "jsonwebtoken";
export const router = express.Router();

router.route('/signup').post(async (request,response) =>{
    const {firstName,lastName,email,password} = request.body;
    try{
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password,salt);
        const user = new User({
	    firstName,
            lastName,
            email,
            password : passwordHash
        });
        await user.save();
        //Storing user to mongoDB
        response.send(user);
        
    }catch(e){
        console.log("not working");
        response.send(e);
    }
})

router.route("/login").post(async (request,response) =>{
    const {email,password} = request.body;
    try{
        const user = await User.findOne({email});
        const dbPassword = user.password;
        const isMatch = await bcrypt.compare(password,dbPassword);
        console.log(isMatch);
        if(isMatch) {
            //true
            const token = jwt.sign({id:user._id},process.env.SECRET_KEY);
            response.send({
                ...user.toObject(),
                token,
                message: "Login successful"
            });
        }else{
            //false
            response.status(500);
            response.send({
                message:"Invalid credentials !!!",
            });
        }
    }catch(e){
        response.send(e);
    }
})

const s3 = new AWS.S3({
    accessKeyId : process.env.AWS_ID,
    secretAccessKey : process.env.AWS_SECRET
})

const storage = multer.memoryStorage({
    destination : (req, file, callback) =>{
        callback(null,'');
    }
})
const upload = multer({storage}).single('image');
router.route('/upload').post(auth,upload,async(request,response) =>{
    let myFile = request.file.originalname.split(".");
    const fileType = myFile[myFile.length-1];
   
    const params = {
        Bucket:process.env.AWS_BUCKET_NAME,
        Key:`${uuid()}.${fileType}`,
        Body:request.file.buffer
    }
    s3.upload(params,(error,data)=>{
        if(error){
            response.status(500).send(error);
        }
        response.status(200).send(data);
    })
})
router.route('/download').get(auth,async(request,response) =>{
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME
    };
    s3.listObjects(params, (err, data) =>{
        if (err) {
            console.log(err, err.stack);
        } // an error occurred
        else   {  
            console.log(data);  
            response.send(data);
        }
    })
})

