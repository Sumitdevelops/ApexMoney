import dotenv from 'dotenv'
dotenv.config()
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
import authRouter from './routers/auth.router.js'
import cors from "cors"
import passport from './config/passport.js'
const app = express()

app.set('trust proxy', 1)

const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:5174", "https://apexmoney.netlify.app"],// Replace with your frontend's URL
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json())

const isProduction = process.env.NODE_ENV?.trim().toLowerCase() === "production";

// For cross-origin OAuth (backend ≠ frontend domain), we need sameSite: "none" and secure: true
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: true, // Save even if unmodified - important for OAuth persistence
    saveUninitialized: true, // Initialize session even for unauthenticated requests - important for OAuth
    proxy: true, // Required for Render and other proxies to set secure cookies
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: "session"
    }),
    name: "sessionId", // Custom session cookie name
    cookie: {
        sameSite: "none", // Allow cross-origin cookies (required for OAuth redirect to different domain)
        secure: true,     // HTTPS only (required when sameSite: "none")
        httpOnly: true,   // Prevent JS access
        maxAge: 1000 * 60 * 60 * 24,
        domain: undefined // Let browser set it automatically based on request
    }
};

// In development, use lax sameSite if both frontend and backend are on localhost
if (!isProduction && process.env.FRONTEND_URL?.includes('localhost')) {
    sessionConfig.cookie.sameSite = "lax";
    sessionConfig.cookie.secure = false;
}

app.use(session(sessionConfig))

app.use(passport.initialize());
app.use(passport.session());

app.use("/user", userRouter)
app.use('/expense', expenseRouter)
app.use('/income', incomeRouter)
app.use('/ai', aiRouter)
app.use('/goals', goalRouter)
app.use('/subscriptions', subscriptionRouter)
app.use('/reminders', reminderRouter)
app.use('/auth', authRouter)


connectDb().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`App is listening on post ${process.env.PORT || 8000}`);
    })
}).catch((error) => {
    console.error("Database connection failed:", error);
})