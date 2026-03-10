# ApexMoney - Production Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] All secrets in .env (never in code)
- [ ] NODE_ENV=production in backend
- [ ] HTTPS enabled on frontend hosting
- [ ] CORS correctly configured
- [ ] Rate limiting active
- [ ] Helmet security headers active
- [ ] Database authentication enabled
- [ ] Backup strategy implemented
- [ ] Error handling configured
- [ ] Logging service connected

### Compliance
- [ ] Google Analytics configured (VITE_GA_ID set)
- [ ] Privacy policy finalized and legal reviewed
- [ ] Terms of Service finalized and legal reviewed
- [ ] Account deletion tested end-to-end
- [ ] Data export tested
- [ ] Password requirements enforced (8+ chars, uppercase, number)
- [ ] All input validation active
- [ ] Responsive design tested on 3+ mobile devices

### Performance
- [ ] Database indexes created
- [ ] API response times < 1 second (typical)
- [ ] Frontend bundle < 500KB gzipped (target)
- [ ] Images optimized
- [ ] CDN configured for static assets

### Testing
- [ ] Signup flow tested (email & Google)
- [ ] Login/logout tested
- [ ] Account deletion tested and verified
- [ ] Data export tested
- [ ] Expense/Income/Goal creation tested
- [ ] Rate limiting tested
- [ ] Error messages verified
- [ ] Mobile responsiveness verified
- [ ] Analytics events firing correctly

---

## Environment Variables Template

### Backend (.env)

```bash
# REQUIRED - Database
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/apexmoney

# REQUIRED - Session & Security
SESSION_SECRET=your_min_32_char_secret_string_here_1234567890
JWT_SECRET=your_min_32_char_secret_string_here_1234567890

# REQUIRED - Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback

# REQUIRED - Email Service
RESEND_API_KEY=re_your_api_key_here

# REQUIRED - Environment
NODE_ENV=production
PORT=8000

# REQUIRED - Frontend URLs
FRONTEND_URL=https://apexmoney.netlify.app
FRONTEND_URL_LOCAL=http://localhost:5173

# OPTIONAL - AI Services
GROK_API_KEY=your_grok_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# OPTIONAL - Rate Limiting (defaults work fine)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_GENERAL_MAX=60
```

### Frontend (.env)

```bash
# REQUIRED - Backend API
VITE_BACKENDURL=https://api.yourdomain.com

# REQUIRED - Google Analytics
VITE_GA_ID=G-YOUR_MEASUREMENT_ID

# OPTIONAL - Environment
VITE_ENV=production
```

---

## Deployment Steps

### Step 1: Backend Deployment (Render or similar)

#### On Your VCS (GitHub)

```bash
# Ensure code is pushed
git add .
git commit -m "Production ready - Play Store compliance"
git push origin main
```

#### Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select ApexMoney repository
5. Configure:
   - **Name**: apexmoney-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Select closest to users
   - **Plan**: Standard ($12/month or higher for production)

#### Set Environment Variables

1. In Render dashboard, go to your service
2. Click "Environment"
3. Add all variables from `.env.example`
4. Deploy will restart automatically

#### Verify Deployment

```bash
# Test API endpoint
curl https://api.yourdomain.com/user/health

# Should return: {"status":"ok"}
```

---

### Step 2: Frontend Deployment (Netlify)

#### On Your VCS

```bash
# Ensure latest code pushed
git add .
git commit -m "Production ready with analytics and compliance"
git push origin main
```

#### Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub
4. Select ApexMoney_Frontend repository
5. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Branch**: `main`

#### Set Environment Variables

1. Go to Site settings → Environment
2. Add:
   ```
   VITE_BACKENDURL=https://api.yourdomain.com
   VITE_GA_ID=G-YOUR_MEASUREMENT_ID
   VITE_ENV=production
   ```
3. Click "Deploy site"

#### Configure Domain

1. Go to Site settings → Domain management
2. Add custom domain (if you have one)
3. Update SSL/TLS settings
4. Configure redirects (add `_redirects` file in public/)

---

### Step 3: Database Setup

#### MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Configure:
   - **Cluster Tier**: M1 (free tier) or higher for production
   - **Region**: Same as backend region
4. Create database user
5. Get connection string (for MONGODB_URL)
6. Whitelist IP addresses (or allow all for testing)

#### Verify Connection

```bash
# From your backend:
npm test-features.js

# Should connect and show collections
```

---

### Step 4: Email Service (Resend)

1. Go to [Resend Dashboard](https://resend.com)
2. Create account
3. Get API key
4. Add to RESEND_API_KEY
5. Test:
   ```bash
   # Call password reset endpoint
   # Should receive OTP email
   ```

---

### Step 5: Google Analytics

1. Go to [Google Analytics](https://analytics.google.com)
2. Create property "ApexMoney"
3. Get Measurement ID (G-XXXXXXXXXX)
4. Add to VITE_GA_ID in frontend `.env`
5. Test:
   ```javascript
   // Open browser console
   gtag('event', 'test_event');
   // Check Real-time reports in GA4
   ```

---

### Step 6: Google OAuth Setup

#### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project "ApexMoney"
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Application Type**: Web
   - **Authorized Origins**: 
     ```
     https://apexmoney.netlify.app
     https://yourdomain.com
     ```
   - **Authorized Redirect URLs**:
     ```
     https://api.yourdomain.com/auth/google/callback
     ```
5. Copy Client ID and Secret
6. Add to environment variables

---

## Post-Deployment Verification

### API Health Check

```bash
# Test endpoints without auth
curl https://api.yourdomain.com/user/health

# Test with auth
curl -X GET https://api.yourdomain.com/user/session \
  -H "Cookie: sessionId=YOUR_SESSION_ID"

# Should return user or auth error
```

### Database Check

```bash
# Verify collections exist
db.users.find().limit(1)
db.expenses.find().limit(1)
db.income.find().limit(1)
```

### Analytics Check

1. Visit app in browser
2. Check GA4 Real-time reports
3. Trigger test events
4. Verify they appear in Real-time
5. Wait 24-48 hours for historical data

### Email Check

1. Go to /forgot-password
2. Enter email
3. Should receive OTP email
4. Successfully verify OTP

### CORS Check

```bash
curl -X OPTIONS https://api.yourdomain.com/user/session \
  -H "Origin: https://apexmoney.netlify.app" \
  -H "Access-Control-Request-Method: GET"

# Should include CORS headers in response
```

---

## Monitoring Setup

### Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/node
npm install -D @sentry/tracing
```

```javascript
// In index.js
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
})
```

### Logs

Check deployment logs:
- **Render**: Logs tab in dashboard
- **Netlify**: Deploy logs and function logs
- **MongoDB**: Admin logs

### Alerts

Set up alerts for:
- [ ] Backend crashes
- [ ] Database connection errors
- [ ] High error rates (>5%)
- [ ] Long response times (>1s)

---

## Maintenance Procedures

### Weekly
- [ ] Check error rate in Sentry
- [ ] Review database size
- [ ] Monitor API response times
- [ ] Check storage quota

### Monthly
- [ ] Update dependencies (npm update)
- [ ] Run security audit (npm audit)
- [ ] Review analytics trends
- [ ] Check backup integrity

### Quarterly
- [ ] Penetration testing
- [ ] Security review
- [ ] Performance optimization
- [ ] Capacity planning

---

## Rollback Procedure

If deployment breaks:

### Backend Rollback
1. Go to Render dashboard
2. Find previous successful deployment
3. Click "Redeploy" on that version
4. Rollback complete in 2-3 minutes

### Frontend Rollback
1. Go to Netlify dashboard
2. Deploys tab
3. Click "Restore" on previous working version
4. Rollback complete in 1-2 minutes

### Database Rollback
- Keep 7-day rolling backup
- MongoDB Atlas: Point-in-time recovery
- Instructions in MongoDB Atlas settings

---

## Scaling Strategy

### When to Scale

**Signs you need to scale:**
- Response times > 1 second
- Error rate > 5%
- Database CPU > 80%
- Storage > 80% of quota

### Scaling Steps

**Backend**:
1. Render dashboard → Plan dropdown
2. Select higher tier (Standard → Professional)
3. Scale automatically handles traffic spike

**Database**:
1. MongoDB Atlas → Cluster settings
2. Upgrade to M2 or M5 tier
3. Add read replicas for load balancing

**Frontend**:
1. Netlify automatically scales CDN
2. No manual action needed

---

## Disaster Recovery

### Backup Strategy
- Daily: MongoDB backup (14-day retention minimum)
- Weekly: Database export to S3
- Monthly: Full system backup

### Recovery Plan
1. **Data Loss**: Restore from MongoDB backup (same day)
2. **Service Down**: Rollback to last known good version
3. **Security Breach**: Isolate, patch, notify users

### RTO/RPO
- **RTO** (Recovery Time): < 1 hour
- **RPO** (Recovery Point): < 1 hour

---

## Post-Launch Optimization

### Performance Optimization
```bash
# Frontend
npm run build  # Creates optimized bundle

# Measure
npm install -g lighthouse
lighthouse https://apexmoney.netlify.app
```

### Cost Optimization
- Monitor bandwidth usage
- Use CDN for static assets
- Implement caching headers
- Optimize database queries

### Reliability Targets
- Uptime: 99.5%
- Error rate: < 0.5%
- Response time: < 500ms (p95)
- Page load: < 3 seconds (full page)

---

## Support & Escalation

### Support Channels
- [ ] Email support endpoint
- [ ] In-app error reporting
- [ ] GitHub issues for bugs
- [ ] Monthly status page

### Escalation Path
1. **Tier 1**: Support team
2. **Tier 2**: Engineering lead
3. **Tier 3**: Technical architect
4. **Tier 4**: Third-party service provider

### SLA Templates
- **Critical**: Response 1 hour, Resolution 4 hours
- **High**: Response 4 hours, Resolution 24 hours
- **Medium**: Response 24 hours, Resolution 72 hours
- **Low**: Response 72 hours, Resolution 7 days

---

## Final Production Checklist

**Before Going Live:**

```
SECURITY
[ ] All secrets in environment variables
[ ] HTTPS enabled
[ ] Headers configured (helmet)
[ ] Rate limiting tested
[ ] Input validation tested
[ ] Auth flows tested

COMPLIANCE
[ ] Privacy policy published
[ ] Terms of service published
[ ] Google Analytics configured
[ ] Account deletion tested
[ ] Data export tested
[ ] Password security enforced

PERFORMANCE
[ ] Backend response time < 1s
[ ] Frontend bundle < 500KB
[ ] Images optimized
[ ] Database indexes created
[ ] Caching configured

OPERATIONS
[ ] Error tracking (Sentry)
[ ] Logging configured
[ ] Backups enabled
[ ] Recovery plan documented
[ ] Monitoring alerts active

TESTING
[ ] All auth flows tested
[ ] CRUD operations tested
[ ] API rate limits tested
[ ] Mobile responsiveness verified
[ ] Cross-browser testing done

DOCUMENTATION
[ ] Deployment guide completed
[ ] Runbook created
[ ] API documentation updated
[ ] Security documentation finalized
[ ] Analytics tracking documented
```

### Sign-off Checklist
- [ ] Product Manager: Feature complete
- [ ] QA: Testing complete
- [ ] Security: Security review passed
- [ ] DevOps: Infrastructure ready
- [ ] Legal: Compliance verified
- [ ] CEO/Leadership: Approval to launch

---

## Launch Day Timeline

### T-24 hours
- [ ] Final testing in production environment
- [ ] Backup taken
- [ ] Team on standby

### T-1 hour
- [ ] Final health checks
- [ ] Monitoring dashboards open
- [ ] Support team briefed

### T-0 (Go Live)
- [ ] Deploy backend
- [ ] Verify API health
- [ ] Deploy frontend
- [ ] Verify frontend loads
- [ ] Test critical flows

### T+1 hour
- [ ] Monitor error rates
- [ ] Check analytics
- [ ] Monitor database performance
- [ ] Verify backup captured

### T+24 hours
- [ ] All systems stable
- [ ] No critical issues
- [ ] Analytics data flowing
- [ ] Email working

---

## Celebrate! 🎉

You've successfully deployed ApexMoney to production with:
- ✅ Google Play Store compliance
- ✅ Production-grade security
- ✅ Full monitoring and analytics
- ✅ Regulatory compliance (GDPR, CCPA)
- ✅ Disaster recovery

Next steps:
1. Monitor closely for first week
2. Gather user feedback
3. Plan Phase 2 features
4. Set up continuous improvement process
