import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { connectDb } from './config/Db.js'
import userRouter from './routers/user.router.js'
import expenseRouter from './routers/expense.router.js'
import incomeRouter from './routers/income.router.js'
import aiRouter from './routers/ai.router.js'
import goalRouter from './routers/goal.router.js'
import subscriptionRouter from './routers/subscription.router.js'
import reminderRouter from './routers/reminder.router.js'
import authRouter from './routers/auth.router.js'
import passport from './config/passport.js'
const app = express()

app.set('trust proxy', 1)

// --- Security Middleware ---

// Helmet: set secure HTTP headers
app.use(helmet())

// CORS: allow requests only from known frontend origins
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174"
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};
app.use(cors(corsOptions));

// Limit request body size to prevent large-payload attacks
app.use(express.json({ limit: "1mb" }))

// Rate limiting: 100 requests per 15 minutes per IP
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(rateLimiter)

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
        domain: isProduction ? ".apexmoney.dev" : undefined // Share cookie across subdomains in production
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
        console.log(`App is listening on port ${process.env.PORT || 8000}`);
    })
}).catch((error) => {
    console.error("Database connection failed:", error);
})