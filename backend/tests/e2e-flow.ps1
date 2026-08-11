$ErrorActionPreference = "Stop"
$base = "http://localhost:5000/api"

$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"sales@example.com","password":"Sales@123"}'
$token = $login.data.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "1. Login OK: $($login.data.user.name) ($($login.data.user.role))"

$cust = Invoke-RestMethod -Uri "$base/customers?limit=1" -Headers $headers
$cid = $cust.data[0].id
Write-Host "2. Customer: $($cust.data[0].customerName)"

$prod = Invoke-RestMethod -Uri "$base/products?limit=2" -Headers $headers
$p1 = $prod.data[0]
$p2 = $prod.data[1]
$stockBefore1 = $p1.currentStock
$stockBefore2 = $p2.currentStock
Write-Host "3. Products: $($p1.sku) stock=$stockBefore1 | $($p2.sku) stock=$stockBefore2"

$body = @{ customerId = $cid; items = @(@{ productId = $p1.id; quantity = 2 }, @{ productId = $p2.id; quantity = 1 }) } | ConvertTo-Json -Depth 5
$challan = Invoke-RestMethod -Uri "$base/challans" -Method Post -Headers $headers -ContentType "application/json" -Body $body
$chId = $challan.data.id
Write-Host "4. DRAFT created: $($challan.data.challanNumber) status=$($challan.data.status) qty=$($challan.data.totalQuantity)"

$snap = $challan.data.items[0]
Write-Host "5. Snapshot: name=$($snap.productNameSnapshot) sku=$($snap.skuSnapshot) price=$($snap.unitPriceSnapshot)"

$confirmed = Invoke-RestMethod -Uri "$base/challans/$chId/confirm" -Method Post -Headers $headers -ContentType "application/json" -Body '{}'
Write-Host "6. Confirmed: $($confirmed.data.status)"

$prodAfter = Invoke-RestMethod -Uri "$base/products/$($p1.id)" -Headers $headers
Write-Host "7. Stock after confirm: $($p1.sku) $stockBefore1 -> $($prodAfter.data.currentStock) (expect $($stockBefore1 - 2))"

$mov1 = Invoke-RestMethod -Uri "$base/products/$($p1.id)/stock-movements?limit=1" -Headers $headers
Write-Host "8. Latest movement: type=$($mov1.data[0].movementType) qty=$($mov1.data[0].quantity) reason=$($mov1.data[0].reason)"

$tooMany = @{ customerId = $cid; items = @(@{ productId = $p1.id; quantity = 999999 }) } | ConvertTo-Json -Depth 5
$bigDraft = Invoke-RestMethod -Uri "$base/challans" -Method Post -Headers $headers -ContentType "application/json" -Body $tooMany
Write-Host "9. Draft with huge qty created (drafts do not validate stock): $($bigDraft.data.challanNumber)"
try {
  Invoke-RestMethod -Uri "$base/challans/$($bigDraft.data.id)/confirm" -Method Post -Headers $headers -ContentType "application/json" -Body '{}' | Out-Null
  $insufficient = "NO ERROR (BAD)"
} catch {
  $insufficient = "HTTP $($_.Exception.Response.StatusCode.value__): $($_.ErrorDetails.Message | ConvertFrom-Json).message"
}
Write-Host "10. Confirm insufficient-stock rejected: $insufficient"

$wlogin = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"warehouse@example.com","password":"Warehouse@123"}'
$wheaders = @{ Authorization = "Bearer $($wlogin.data.token)" }
$stockBody = @{ productId = $p1.id; quantity = 1; movementType = "IN"; reason = "Stock Adjustment" } | ConvertTo-Json
$adj = Invoke-RestMethod -Uri "$base/stock-movements" -Method Post -Headers $wheaders -ContentType "application/json" -Body $stockBody
Write-Host "11. Manual stock IN (warehouse): $($adj.data.movementType) x$($adj.data.quantity) reason=$($adj.data.reason)"
Write-Host "FLOW TEST COMPLETE"