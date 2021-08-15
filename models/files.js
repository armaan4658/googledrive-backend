import mongoose from "mongoose";
const fileSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true
    },
    key:{
        type: String,
        required: true
    }
  });
export const File = mongoose.model("File", fileSchema);