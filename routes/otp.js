import express from 'express';
import {Otp} from '../models/otp.js';
export const otpRouter = express.Router();

otpRouter.get('/get',async(req,res)=>{
    try{
        const otp = await Otp.find();
        res.send(otp);
    }catch(e){
        res.status(402).send(e);
    }
})

otpRouter.delete('/delete/:id',async(req,res)=>{
    try{
        const {id} = req.params;
        const otp = await Otp.findByIdAndDelete(id,(err,data)=>{
            err ? res.status(402).send(e) : res.send({"message":"green"});
        })
    }catch(e){
        res.status(402).send(e)
    }
})