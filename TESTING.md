# 🧪 Quick Testing Guide

## Step 1: Get User and Asset IDs

```bash
# Option 1: Use Prisma Studio (easiest)
npm run db:studio
```

Open http://localhost:5555 and copy:
- Alice's User ID from the `users` table
- Gold Coins Asset ID from the `asset_types` table

```bash
# Option 2: Use helper script
npx ts-node scripts/get-ids.ts
```

## Step 2: Test with curl

Replace `YOUR_USER_ID` and `YOUR_ASSET_ID` with actual IDs:

### Top-up 100 credits
```bash
curl -X POST http://localhost:3000/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "assetTypeId": "YOUR_ASSET_ID",
    "amount": 100,
    "idempotencyKey": "test-1"
  }'
```

### Check balance
```bash
curl "http://localhost:3000/api/wallet/balance?userId=YOUR_USER_ID&assetTypeId=YOUR_ASSET_ID"
```

### Spend 30 credits
```bash
curl -X POST http://localhost:3000/api/wallet/spend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "assetTypeId": "YOUR_ASSET_ID",
    "amount": 30,
    "idempotencyKey": "test-2"
  }'
```

## Step 3: Verify

Check balance again - should be 70:
```bash
curl "http://localhost:3000/api/wallet/balance?userId=YOUR_USER_ID&assetTypeId=YOUR_ASSET_ID"
```

View transaction history:
```bash
curl "http://localhost:3000/api/wallet/transactions?userId=YOUR_USER_ID&assetTypeId=YOUR_ASSET_ID"
```

## Full Testing Guide

See [API_TESTING_GUIDE.md](file:///C:/Users/ghima/.gemini/antigravity/brain/8a2fecfa-1bf7-4daa-a544-7c80fefb7b7f/API_TESTING_GUIDE.md) for complete documentation.
