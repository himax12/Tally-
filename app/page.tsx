export default function Home() {
  return (
    <main>
      <h1>Wallet System API</h1>
      <p>Production-grade wallet service with double-entry ledger bookkeeping.</p>
      <h2>Endpoints</h2>
      <ul>
        <li>POST /api/wallet/topup</li>
        <li>POST /api/wallet/bonus</li>
        <li>POST /api/wallet/spend</li>
        <li>GET /api/wallet/balance</li>
        <li>GET /api/wallet/transactions</li>
        <li>GET /api/metrics</li>
      </ul>
    </main>
  )
}
