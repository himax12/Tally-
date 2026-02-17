#!/bin/bash

# Quick Test Script for Wallet API
# This script tests all API endpoints with example data

echo "🧪 Wallet API Test Script"
echo "========================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server is not running on http://localhost:3000"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Get IDs from database
echo "📋 Fetching IDs from database..."
IDS=$(npx ts-node scripts/get-ids.ts 2>/dev/null | grep "ID:")

# Extract first user ID and first asset type ID
USER_ID=$(echo "$IDS" | head -1 | awk '{print $2}')
ASSET_ID=$(echo "$IDS" | tail -1 | awk '{print $2}')

if [ -z "$USER_ID" ] || [ -z "$ASSET_ID" ]; then
    echo "❌ Could not fetch IDs from database"
    echo "Please run: npm run db:seed"
    exit 1
fi

echo "User ID: $USER_ID"
echo "Asset ID: $ASSET_ID"
echo ""

# Test 1: Top-up
echo "🔹 Test 1: Top-up 100 credits"
curl -s -X POST http://localhost:3000/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"assetTypeId\":\"$ASSET_ID\",\"amount\":100,\"idempotencyKey\":\"script-test-1\"}" \
  | jq '.'
echo ""

# Test 2: Check balance
echo "🔹 Test 2: Check balance"
curl -s "http://localhost:3000/api/wallet/balance?userId=$USER_ID&assetTypeId=$ASSET_ID" | jq '.data.balance'
echo ""

# Test 3: Bonus
echo "🔹 Test 3: Add 50 bonus credits"
curl -s -X POST http://localhost:3000/api/wallet/bonus \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"assetTypeId\":\"$ASSET_ID\",\"amount\":50,\"idempotencyKey\":\"script-test-2\"}" \
  | jq '.'
echo ""

# Test 4: Check balance again
echo "🔹 Test 4: Check balance (should be 150)"
curl -s "http://localhost:3000/api/wallet/balance?userId=$USER_ID&assetTypeId=$ASSET_ID" | jq '.data.balance'
echo ""

# Test 5: Spend
echo "🔹 Test 5: Spend 30 credits"
curl -s -X POST http://localhost:3000/api/wallet/spend \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"assetTypeId\":\"$ASSET_ID\",\"amount\":30,\"idempotencyKey\":\"script-test-3\"}" \
  | jq '.'
echo ""

# Test 6: Final balance
echo "🔹 Test 6: Final balance (should be 120)"
curl -s "http://localhost:3000/api/wallet/balance?userId=$USER_ID&assetTypeId=$ASSET_ID" | jq '.data.balance'
echo ""

# Test 7: Transaction history
echo "🔹 Test 7: Transaction history"
curl -s "http://localhost:3000/api/wallet/transactions?userId=$USER_ID&assetTypeId=$ASSET_ID&limit=5" \
  | jq '.data.transactions | length'
echo " transactions found"
echo ""

# Test 8: Error case - insufficient balance
echo "🔹 Test 8: Try to spend more than balance (should fail)"
curl -s -X POST http://localhost:3000/api/wallet/spend \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"assetTypeId\":\"$ASSET_ID\",\"amount\":999999,\"idempotencyKey\":\"script-test-fail\"}" \
  | jq '.error'
echo ""

# Test 9: Idempotency
echo "🔹 Test 9: Test idempotency (send same request twice)"
echo "First request:"
curl -s -X POST http://localhost:3000/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"assetTypeId\":\"$ASSET_ID\",\"amount\":10,\"idempotencyKey\":\"idempotency-test\"}" \
  | jq '.data.transactionId'

echo "Second request (same key):"
curl -s -X POST http://localhost:3000/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"assetTypeId\":\"$ASSET_ID\",\"amount\":10,\"idempotencyKey\":\"idempotency-test\"}" \
  | jq '.data.transactionId'
echo "(Transaction IDs should be the same)"
echo ""

echo "✅ All tests completed!"
echo ""
echo "📊 Final balance:"
curl -s "http://localhost:3000/api/wallet/balance?userId=$USER_ID&assetTypeId=$ASSET_ID" | jq '.data'
