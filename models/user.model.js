import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        require:true,
        trim:true
    }
})

export const User=mongoose.model("User",userSchema)