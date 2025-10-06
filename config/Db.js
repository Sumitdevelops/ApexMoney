import mongoose from "mongoose";

 export const connectDb=async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log("Database conencted successfully");
        
    } catch (error) {
        console.log("Error1:",error);
        
    }
}