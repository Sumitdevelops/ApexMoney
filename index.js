import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { connectDb } from './config/Db.js'
import userRouter from './routers/user.router.js'

const app=express()

app.use(express.json())

connectDb().then(()=>{
    app.listen(process.env.PORT||8000,()=>{
    console.log(`App is listening on post ${process.env.PORT}`);
    
})
}).catch((error)=>{
    console.log(error);
    
})


app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    store:MongoStore.create({
        mongoUrl:process.env.MONGODB_URL,
        collectionName:"session"
    }),
    cookie:{
        sameSite:process.env.NODE_ENV==="production"?"none":"lax",
        secure:process.env.NODE_ENV==="production",
        httpOnly:true,
        maxAge:1000*60*60*24

    }
    
}))

app.use("/create",userRouter)







