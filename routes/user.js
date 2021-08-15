import bcrypt from "bcrypt";
import dotenv from "dotenv/config" ;
import multer from "multer";
import AWS from "aws-sdk";
import uuid from "uuid";
import express, { request, response } from "express";
import {User} from '../models/signupschema.js';
import {File} from '../models/files.js';
import {auth} from '../middleware/auth.js';
import jwt from "jsonwebtoken";
import {Otp} from '../models/otp.js';
import nodemailer from "nodemailer";
export const router = express.Router();

//signing up
router.route('/signup').post(async(req,res)=>{
    const {firstName,lastName,email,password} = req.body;
    try{
        const hos = await User.findOne({email});
        if(!hos){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password,salt);
            const user = new User({
                firstName,
                lastName,
                email,
                password:hashedPassword,
                status:"inactive"
            })
            const otp = Math.floor(1000 + Math.random()*9000);
            const verify = new Otp({
                email,
                otp
            })
            //saving to database
            const users = await user.save();
            //saving otp in db
            await verify.save();
            const sub="G-drive confirmation e-mail";
            const link = await bcrypt.genSalt(4);
            const href=`http://localhost:3000/verify/${users._id}`;
            const message = `<b>Your one time password is : ${otp}</b><br/>
            Click the link below to verify your account<br/>
            <a href=${href}>${link} </a>`
            //sending confirmation email
            sendEmail(email,sub,message);
            res.status(200).send({"message":"green"});
        }else{
            res.send({"message":"Account already exist"});
        }
    }catch(e){
        res.status(400).send({error:e});
    }
})

//logging in
router.route("/login").post(async(req,res)=>{
    const {email,password} = req.body;
    try{
        const users = await User.findOne({email});
        if(users){
            if(users.status=="inactive"){
                res.send({"message":"Your account has not been verified"});
            }
            const inDbPassword = users.password;
            const isPassword = await bcrypt.compare(password,inDbPassword);
            if(isPassword){
                const user = {id:email}
                const accessToken = jwt.sign(user,process.env.SECRET_KEY);
                res.cookie("jwt",`${accessToken}`,{
                    expires: new Date(Date.now() + (60000*60)),
                    path: "/",
                    httpOnly: true,
                    secure: true,
                    sameSite: "Strict",
                })
                res.send({"message":"green","_id":users._id});
            }else{
                res.send({"message":"Unauthorized user"});
            }
        }else{
            res.send({"message":"Invalid credentials"});
        }
    }catch(e){
        res.status(402).send({"error":e});
    }
})

//log out
router.route('/logout').get(async(req,res) => {
    try{
        res.clearCookie('jwt');
        res.send({"message":"green"});
    }catch(e){
        res.status(404).send({"error":e});
    }
})

//getting user data
router.route("/get/:id").get(async(req,res)=>{
    try{
        const {id} = req.params;
        const {firstName,lastName,email} = await User.findById(id);
        res.send({firstName,lastName,email});
    }catch(e){
        res.send({"error":e});
    }
})

//user update
router.route("/update/:id").patch(async(req,res)=>{
    try{
        const {id} = req.params;
        const {firstName,lastName,email,password,status} = req.body;
        const users = await User.findById(id);
        if(firstName){
            users.firstName = firstName;
        }
        if(lastName){
            users.lastName = lastName;
        }
        if(email){
            users.email = email;
        }
        if(password){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password,salt);
            users.password = hashedPassword;
        }
        if(status){
            users.status = status;
        }
        await users.save();
        res.send({"message":"green"});
    }catch(e){
        res.send({"error":e});
    }
})

//otp verification
router.route("/otp").patch(async(req,res) =>{
    try{
        const {otp,email} = req.body;
        const verify = await Otp.findOne({email});
        if(otp==verify.otp){
            const users = await User.findOne({email});
            users.status="active";
            await users.save();
            res.send({"message":"green"})
        }else{
            res.send({"message":"OTP entered is incorrect"})
        }
    }catch(e){
        res.send({"error":e});
    }
})

//sending forgotpassword link
router.route("/forgotpassword/:email").get(async(req,res)=>{
    try{
        const {email} = req.params;
        const users = await User.findOne({email})
        const salt = await bcrypt.genSalt(3);
        const sub ="G-drive password reset";
        const href=`http://localhost:3000/passwordreset/${users._id}`;
        const message = `<b>Click the link below to reset your password : </b><br/>
        <a href=${href}>${salt} </a>`;
        //sending e-mail
        sendEmail(users.email,sub,message);
        res.send({"message":"green"});
    }catch(e){
        res.send({"error":e});
    }
})

//sending email
const sendEmail = async(hospitalEmail,sub,message) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL, // generated ethereal user
        pass: process.env.PASSWORD, // generated ethereal password
      },
    });
    // send mail with defined transport object
    let info = {
      from: `"Test Maan" <${process.env.EMAIL}>`, // sender address
      to: `${hospitalEmail}`, // list of receivers
      subject: `${sub}`,  // plain text body
      html: `${message} ` // html body
    };
     transporter.sendMail(info,(err,data)=>{
        if(err){
            console.log(err);
        }else{
            console.log(`Email sent to : ${hospitalEmail}`);
        }
    })
  
}
AWS.config.update({
    region:'us-east-2',
    accessKeyId : process.env.AWS_ID,
    secretAccessKey : process.env.AWS_SECRET,
})

const s3 = new AWS.S3();

const storage = multer.memoryStorage({
    destination : (req, file, callback) =>{
        callback(null,'');
    }
})
const upload = multer({storage}).single('image');
router.route('/upload').post(auth,upload,async(request,response) =>{
    // let myFile = request.data.originalname.split(".");
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
        response.status(200).send({"message":"green","data":data});
    })
        
})

router.route('/uploadDb').post(auth,async(request,response) => {
    const {userId,key} = request.body;
    const file = new File({
        userId,
        key
    })
    const dbFile = await file.save();
    response.send({"message":"green"});
})


router.route('/download/:userId').get(auth,async(request,response) =>{
    const {userId} = request.params;
    const files = await File.find({userId});
    const fileLinks = [];
    if(files.length!==0){
        try{
            const func = (value,index)=>{
                const url = s3.getSignedUrlPromise('getObject',{
                    Bucket:process.env.AWS_BUCKET_NAME,
                    Key:value.key,
                    Expires:120,

                },(err,data)=>{
                    if(err){
                        response.status(402).send(err);
                    }else{
                        fileLinks.push(data);
                        if(index===(files.length-1)){
                            response.send({"message":"green","url":fileLinks});
                        }
                    }
                })
            }
            files.forEach(func);
        }catch(e){
            response.status(402).send({"error":e})
        }
    }else{
        response.send({"message":"No files has been added yet"});
    }
})

