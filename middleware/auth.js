import jwt from "jsonwebtoken";
export const auth = (req,res,next)=>{
    try{
        const token = req.cookies;
        jwt.verify(token.jwt,process.env.SECRET_KEY,(err,user)=>{
            if(err) return res.send({"error":err});
            req.user = user;
            next();
        });
    }catch(e){
        res.status(500).send({"error":e});
    }
}