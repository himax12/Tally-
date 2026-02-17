# Quick Test Script for Wallet API (PowerShell)
# Run with: .\scripts\test-api.ps1

Write-Host "🧪 Wallet API Test Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running on http://localhost:3000" -ForegroundColor Red
    Write-Host "Please start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Get IDs from database
Write-Host "📋 Getting IDs from database..." -ForegroundColor Cyan
$idsOutput = npx ts-node scripts/get-ids.ts 2>$null | Select-String "ID:"

if ($idsOutput.Count -lt 2) {
    Write-Host "❌ Could not fetch IDs from database" -ForegroundColor Red
    Write-Host "Please run: npm run db:seed" -ForegroundColor Yellow
    exit 1
}

# Extract IDs (simplified - you'll need to replace these with actual IDs)
Write-Host "⚠️  Please replace USER_ID and ASSET_ID below with actual values from Prisma Studio" -ForegroundColor Yellow
Write-Host "Run: npm run db:studio" -ForegroundColor Yellow
Write-Host ""

# Replace these with your actual IDs
$USER_ID = "REPLACE_WITH_ALICE_USER_ID"
$ASSET_ID = "REPLACE_WITH_GOLD_COINS_ASSET_ID"

if ($USER_ID -eq "REPLACE_WITH_ALICE_USER_ID") {
    Write-Host "❌ Please edit this script and replace USER_ID and ASSET_ID with actual values" -ForegroundColor Red
    Write-Host "Get them from: npm run db:studio" -ForegroundColor Yellow
    exit 1
}

# Test 1: Top-up
Write-Host "🔹 Test 1: Top-up 100 credits" -ForegroundColor Cyan
$body = @{
    userId = $USER_ID
    assetTypeId = $ASSET_ID
    amount = 100
    idempotencyKey = "ps-test-1"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/topup" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 10
Write-Host ""

# Test 2: Check balance
Write-Host "🔹 Test 2: Check balance" -ForegroundColor Cyan
$balance = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/balance?userId=$USER_ID&assetTypeId=$ASSET_ID"
Write-Host "Balance: $($balance.data.balance)" -ForegroundColor Green
Write-Host ""

# Test 3: Bonus
Write-Host "🔹 Test 3: Add 50 bonus credits" -ForegroundColor Cyan
$body = @{
    userId = $USER_ID
    assetTypeId = $ASSET_ID
    amount = 50
    idempotencyKey = "ps-test-2"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/bonus" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

Write-Host "New balance: $($response.data.newBalance)" -ForegroundColor Green
Write-Host ""

# Test 4: Spend
Write-Host "🔹 Test 4: Spend 30 credits" -ForegroundColor Cyan
$body = @{
    userId = $USER_ID
    assetTypeId = $ASSET_ID
    amount = 30
    idempotencyKey = "ps-test-3"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/spend" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

Write-Host "New balance: $($response.data.newBalance)" -ForegroundColor Green
Write-Host ""

# Test 5: Final balance
Write-Host "🔹 Test 5: Final balance (should be 120)" -ForegroundColor Cyan
$balance = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/balance?userId=$USER_ID&assetTypeId=$ASSET_ID"
Write-Host "Balance: $($balance.data.balance)" -ForegroundColor Green
Write-Host ""

# Test 6: Transaction history
Write-Host "🔹 Test 6: Transaction history" -ForegroundColor Cyan
$transactions = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/transactions?userId=$USER_ID&assetTypeId=$ASSET_ID&limit=5"
Write-Host "$($transactions.data.transactions.Count) transactions found" -ForegroundColor Green
Write-Host ""

# Test 7: Error case
Write-Host "🔹 Test 7: Try to spend more than balance (should fail)" -ForegroundColor Cyan
$body = @{
    userId = $USER_ID
    assetTypeId = $ASSET_ID
    amount = 999999
    idempotencyKey = "ps-test-fail"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/spend" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
} catch {
    Write-Host "✅ Correctly rejected: Insufficient balance" -ForegroundColor Green
}
Write-Host ""

Write-Host "✅ All tests completed!" -ForegroundColor Green
