# ApexMoney - Security Implementation Guide

## Overview
Complete security layering for production deployment and regulatory compliance.

---

## 1. Authentication & Authorization

### Session-Based Authentication
- Stored in MongoDB (`connect-mongo`)
- Secure session cookies with httpOnly flag
- Cross-origin enabled (sameSite: none for Netlify)
- 24-hour maximum age

### Password Security
- Bcrypt hashing with 10 salt rounds
- Minimum 8 characters required
- Uppercase and number requirements
- OTP-based password reset

### Token Flow
```
User Login → Session Created → Cookie Stored → 
Subsequent Requests → System Verifies Session → 
Resource Access Granted/Denied
```

---

## 2. Input Validation

### Schema Validation
- All user input validated with Zod
- No empty values accepted
- Type coercion with validation
- Custom error messages

### Validation Middleware
```javascript
app.post('/expense/add', 
  requireAuth,          // Auth check
  validate(expenseSchema), // Input validation
  addExpense           // Handler
)
```

### Sanitization
- Whitelist approach (explicitly allowed values)
- Enum restrictions on categories
- URL validation on websites
- Array length limits

---

## 3. Authorization

### Role-Based Access Control
```javascript
// All protected routes use requireAuth
export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }
    next();
};
```

### Data Isolation
- All queries filtered by userId
- No cross-user data access
- Sub-resource ownership verification

---

## 4. API Security

### Security Headers (Helmet)
```javascript
// Automatically set by helmet:
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- Strict-Transport-Security
- Referrer-Policy
```

### CORS Configuration
```javascript
corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://apexmoney.netlify.app"
  ],
  credentials: true
}
```

### Rate Limiting
```javascript
// Auth routes: 5 requests/minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5
})

// General API: 60 requests/minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60
})
```

---

## 5. Database Security

### Mongoose Schemas
- Automatic timestamp tracking
- Type validation at schema level
- Required field enforcement
- Enum restrictions

### Indexes for Query Optimization
```javascript
// Fast lookups by userId
expenses.index({ userId: 1, date: -1 })
income.index({ userId: 1, date: -1 })
goals.index({ userId: 1 })
subscriptions.index({ userId: 1 })
```

### Data Deletion on Account Removal
```javascript
// Parallel deletion ensures no orphaned data
await Promise.all([
  Expense.deleteMany({ userId }),
  Income.deleteMany({ userId }),
  FinancialGoal.deleteMany({ userId }),
  Subscription.deleteMany({ userId }),
  AIInsight.deleteMany({ userId }),
  BillReminder.deleteMany({ userId })
])
```

---

## 6. Secrets Management

### Environment Variables
Never commit `.env` file. Store in:
- Platform-specific secret manager (Render, Netlify)
- CI/CD secrets (GitHub Actions)
- Local `.env` file (development only)

### Variables Structure
```
Production (Never expose):
- MONGODB_URL
- JWT_SECRET
- SESSION_SECRET
- GOOGLE_CLIENT_SECRET
- RESEND_API_KEY
- GROK_API_KEY

Frontend Safe:
- VITE_BACKENDURL
- VITE_GA_ID
- VITE_ENV
```

---

## 7. Error Handling

### Centralized Error Handler
```javascript
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'  // Hide stack in production
        : err.message;             // Show details in dev

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && 
            { stack: err.stack })
    });
};
```

### Error Response Format
```json
{
  "success": false,
  "message": "descriptive error message"
}
```

---

## 8. OAuth Security

### Google OAuth 2.0 Flow
1. User clicks "Login with Google"
2. Redirected to Google consent screen
3. User grants permissions
4. Callback URL receives auth code
5. Backend exchanges code for tokens
6. User document created/updated
7. Session established

### Security Measures
- State parameter validation (passport handles)
- HTTPS required for prod
- Callback URL whitelist
- Token expiration handling
- Secure session creation

---

## 9. Data Privacy

### Privacy Controls
- Users can export their data (JSON download)
- Users can delete all personal data
- No third-party sharing without consent
- Accessible privacy policy

### GDPR Compliance
- Right to access (export)
- Right to deletion (delete account)
- Right to data portability (export)
- Consent management required

---

## 10. API Rate Limiting

### Attack Prevention
- Brute force protection (auth routes)
- DDoS mitigation (request limits)
- Resource exhaustion prevention

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1639123456
```

---

## 11. Password Reset Security

### OTP Flow
1. User requests password reset
2. OTP sent to email via Resend
3. OTP valid for 15 minutes
4. User enters OTP and new password
5. Password validation enforced
6. OTP cleared after use

### Implementation
```javascript
// Generate OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const expires = new Date(Date.now() + 15 * 60 * 1000);

// Store OTP
user.resetPasswordOTP = otp;
user.resetPasswordExpires = expires;

// Verify before reset
if (user.resetPasswordExpires < new Date()) {
    return "OTP has expired";
}
```

---

## 12. Session Security

### Session Configuration
```javascript
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL
    }),
    cookie: {
        sameSite: "none",      // Cross-origin
        secure: true,          // HTTPS only
        httpOnly: true,        // No JS access
        maxAge: 1000 * 60 * 60 * 24
    }
};
```

### Cross-Domain Support
- Netlify frontend + hosted backend
- SameSite: none for cross-domain
- Secure flag for HTTPS
- Domain not restricted (auto-detected)

---

## 13. Frontend Security

### XSS Prevention
- React auto-escapes JSX
- No `dangerouslySetInnerHTML`
- Input fields validated before send
- Sanitization in Zod schemas

### CSRF Protection
- Session-based CSRF (cookies)
- State parameter in OAuth
- Request validation on backend

### Component-Level Security
```javascript
// Settings.jsx
- No sensitive data in console
- Passwords not logged
- Verification on delete
- Analytics tracking for compliance
```

---

## 14. Deployment Security

### Environment Detection
```javascript
const isProduction = 
    process.env.NODE_ENV?.trim().toLowerCase() === "production";
```

### Production Checklist
- [ ] NODE_ENV=production
- [ ] All .env variables set
- [ ] HTTPS enabled
- [ ] Database authentication enabled
- [ ] rate limiting active
- [ ] Helmet enabled
- [ ] CORS restricted
- [ ] Logging configured
- [ ] Backups enabled
- [ ] Monitoring enabled

---

## 15. Monitoring & Logging

### Console Logging
- Auth attempts logged
- Errors logged with stack trace
- Database operations tracked
- Session events recorded

### Production Logging Service
Recommended services:
- Sentry (error tracking)
- LogRocket (session replay)
- New Relic (APM)
- Datadog (monitoring)

### What to Log
```
✓ Failed login attempts
✓ Data deletion requests
✓ API errors
✓ Validation failures
✗ Passwords
✗ OTPs
✗ API keys
✗ Private user data
```

---

## 16. Regular Security Tasks

### Code Review
- [ ] Weekly dependency updates
- [ ] Monthly security audit
- [ ] Quarterly penetration testing
- [ ] Annual security review

### Dependency Management
```bash
npm audit
npm update
npm install <specific-version>
```

### Updates
```bash
# Check outdated packages
npm outdated

# Update packages safely
npm update
npm audit fix
```

---

## 17. Incident Response

### Security Incident Process
1. **Detect** - Monitor alerts and logs
2. **Contain** - Isolate affected systems
3. **Assess** - Determine scope and impact
4. **Respond** - Fix the vulnerability
5. **Notify** - Alert affected users
6. **Review** - Post-incident analysis
7. **Improve** - Update processes

### Contacts
- Security team lead: [contact]
- Incident hotline: [contact]
- Legal team: [contact]

---

## 18. Third-Party Security

### Dependencies Used
```
Authentication: passport, passport-google-oauth20
Database: mongoose, connect-mongo
API: express, cors, helmet
Email: resend
AI: groq-sdk, @google/generative-ai
Validation: zod
Hashing: bcrypt
Utilities: date-fns, nodemailer
```

### Vulnerability Monitoring
- npm audit regularly
- GitHub security alerts enabled
- Snyk monitoring (optional)
- Keep packages updated

---

## 19. Compliance Standards

### Standards Adherence
- PCI DSS (if processing payments)
- GDPR (EU data privacy)
- CCPA (California data privacy)
- SOC 2 (optional, for enterprise)

### Privacy Audit Checklist
- [ ] Privacy policy reviewed by legal
- [ ] Terms of service reviewed
- [ ] Data retention policies documented
- [ ] Consent mechanisms in place
- [ ] DPA with hosting provider
- [ ] Incident response plan created
- [ ] User rights processes documented

---

## 20. Security Testing

### Manual Testing
```bash
# Test XSS
<img src=x onerror=alert('xss')>

# Test SQL Injection (MongoDB)
{"$ne": null}

# Test authentication bypass
Remove session cookie

# Test rate limiting
Rapid API requests exceed limit

# Test input validation
Send invalid data types
```

### Tools
- OWASP ZAP (free scanning)
- Burp Suite (professional testing)
- Postman (API testing)
- Lighthouse (frontend audit)

---

## Production Rollout

### Pre-Deployment
1. Run security audit
2. Review all environment variables
3. Test on staging
4. Run penetration test
5. Update security docs
6. Create incident plan
7. Notify stakeholders

### Post-Deployment
1. Monitor error rates
2. Check rate limit behavior
3. Verify analytics tracking
4. Test account deletion
5. Test data export
6. Monitor database
7. Review logs daily for first week
