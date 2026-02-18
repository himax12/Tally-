# Quick Start Guide: Testing the Critical Fixes

## ⚠️ Rate Limiting Dependency Issue

The `express-rate-limit` package installation is failing with EPERM (permission error). This is a Windows-specific issue.

### Solutions (Choose One):

**Option 1: Run as Administrator**
```powershell
# Right-click PowerShell → "Run as Administrator"
cd "c:\Users\ghima\OneDrive\Documents\Desktop\]work\OPENSOURCE\assignment"
npm install express-rate-limit
```

**Option 2: Use Alternative (Recommended for Now)**
We can skip rate limiting for now and test the other 4 critical fixes that ARE working.

---

## ✅ What You Can Test Right Now

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test Pessimistic Locking (Concurrency Safety)

**Run the concurrency test:**
```bash
npm run test:concurrency
```

This will verify that:
- Multiple concurrent transactions don't cause negative balances
- Row-level locks prevent race conditions
- Retry logic handles deadlocks

### 3. Test Transaction Limits

**Test single transaction limit:**
```bash
# Using Postman or curl
POST http://localhost:3000/api/wallet/spend
{
  "userId": "your-user-id",
  "assetTypeId": "your-asset-id",
  "amount": 6000,  # Exceeds max single spend (5000)
  "referenceId": "unique-id-1"
}

# Expected: 400 Bad Request with "Max spend limit exceeded"
```

**Test daily limit:**
```bash
# Make multiple spends totaling > 20000 in one day
# Should fail with "Daily spend limit exceeded"
```

### 4. Test Metrics Collection

**Perform some transactions:**
```bash
POST http://localhost:3000/api/wallet/topup
{
  "userId": "your-user-id",
  "assetTypeId": "your-asset-id",
  "amount": 100,
  "referenceId": "unique-id-2"
}

POST http://localhost:3000/api/wallet/spend
{
  "userId": "your-user-id",
  "assetTypeId": "your-asset-id",
  "amount": 30,
  "referenceId": "unique-id-3"
}
```

**Check metrics:**
```bash
GET http://localhost:3000/api/metrics

# Expected response:
{
  "success": true,
  "window": "5 minutes",
  "stats": {
    "total": 2,
    "success": 2,
    "errors": 0,
    "avgLatency": 245.67,
    "errorRate": 0
  }
}
```

### 5. Verify Database Connection Pooling

**Check the connection string:**
```bash
# In .env file, verify:
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=20"
```

**Monitor connections:**
```sql
-- In PostgreSQL, run:
SELECT count(*) FROM pg_stat_activity WHERE datname = 'wallet_db';
-- Should never exceed 20 connections
```

---

## 🧪 Running All Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Concurrency tests
npm run test:concurrency

# All tests
npm test
```

---

## 🔍 Verify Implementations

### Check Pessimistic Locking
**File:** `lib/ledger.ts` (line 38-70)
- Look for `SELECT ... FOR UPDATE` in `getWalletWithLock()`

### Check Transaction Limits
**File:** `lib/limits.ts`
- Verify limits: maxTopupAmount=10000, maxSpendAmount=5000, maxDailySpend=20000

**File:** `lib/operations.ts` (lines 45-52, 222-229)
- Look for `checkTransactionLimits()` calls before transactions

### Check Metrics
**File:** `lib/metrics.ts`
- Verify `MetricsCollector` singleton exists

**File:** `lib/operations.ts`
- Look for `withMetrics()` wrappers around operations

---

## 📊 What to Look For

### Success Indicators:
✅ No negative balances under concurrent load  
✅ Transactions exceeding limits are rejected  
✅ Metrics API returns accurate statistics  
✅ Structured JSON logs appear in console  
✅ Database connections stay under 20  

### Failure Indicators:
❌ Negative balances after concurrent transactions  
❌ Transactions over limits succeed  
❌ Metrics API returns 500 errors  
❌ No logs in console  
❌ Database connection errors  

---

## 🚀 Next Steps After Testing

1. **If tests pass:** Deploy to staging environment
2. **If tests fail:** Review error logs and fix issues
3. **Rate limiting:** Resolve npm install issue or implement custom solution
4. **Load testing:** Set up k6 and run capacity tests
5. **Production:** Add alerting and monitoring dashboards

---

## 💡 Tips

- Use Postman collection in `postman/` directory for API testing
- Check console logs for structured metrics (JSON format)
- Monitor PostgreSQL logs for lock contention
- Use `GET /api/metrics?window=10` to see 10-minute stats

---

## 🆘 Troubleshooting

**Problem:** Tests fail with "wallet not found"  
**Solution:** Run `npm run db:seed` to create test data

**Problem:** Metrics API returns empty stats  
**Solution:** Perform some transactions first, then check metrics

**Problem:** Connection pool errors  
**Solution:** Restart PostgreSQL and verify DATABASE_URL

**Problem:** Rate limiting not working  
**Solution:** Fix npm install issue or implement custom rate limiter
