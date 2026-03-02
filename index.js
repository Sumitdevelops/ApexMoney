import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { connectDb } from './config/Db.js'
import userRouter from './routers/user.router.js'
import expenseRouter from './routers/expense.router.js'
import incomeRouter from './routers/income.router.js'
import aiRouter from './routers/ai.router.js'
import goalRouter from './routers/goal.router.js'
import subscriptionRouter from './routers/subscription.router.js'
import reminderRouter from './routers/reminder.router.js'
import cors from "cors"
import dotenv from 'dotenv'
const app = express()
dotenv.config()

app.set('trust proxy', 1)

const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:5174", "https://apexmoney.netlify.app"],// Replace with your frontend's URL
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: "session"
    }),
    cookie: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

app.use("/user", userRouter)
app.use('/expense', expenseRouter)
app.use('/income', incomeRouter)
app.use('/ai', aiRouter)
app.use('/goals', goalRouter)
app.use('/subscriptions', subscriptionRouter)
app.use('/reminders', reminderRouter)


connectDb().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`App is listening on post ${process.env.PORT || 8000}`);
    })
}).catch((error) => {
    console.error("Database connection failed:", error);
})