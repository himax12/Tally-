'use client'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💰 Wallet System API
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Production-grade wallet service with double-entry ledger bookkeeping
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                🚀 API Endpoints
              </h2>
              <div className="space-y-3">
                <EndpointCard
                  method="POST"
                  path="/api/wallet/topup"
                  description="Add credits to user wallet (purchase)"
                />
                <EndpointCard
                  method="POST"
                  path="/api/wallet/bonus"
                  description="Issue bonus credits to user"
                />
                <EndpointCard
                  method="POST"
                  path="/api/wallet/spend"
                  description="Spend credits from user wallet"
                />
                <EndpointCard
                  method="GET"
                  path="/api/wallet/balance"
                  description="Get wallet balance"
                />
                <EndpointCard
                  method="GET"
                  path="/api/wallet/transactions"
                  description="Get transaction history"
                />
              </div>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                ✨ Features
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Feature text="Double-entry ledger accounting" />
                <Feature text="ACID transaction guarantees" />
                <Feature text="Idempotency support" />
                <Feature text="Concurrency-safe operations" />
                <Feature text="Balance validation" />
                <Feature text="Retry logic for failures" />
              </ul>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                📚 Documentation
              </h2>
              <p className="text-gray-600">
                See the README.md file for complete API documentation, setup instructions,
                and architecture details.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

function EndpointCard({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors = {
    POST: 'bg-green-100 text-green-800',
    GET: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      <span className={`px-3 py-1 rounded font-mono text-sm font-semibold ${methodColors[method as keyof typeof methodColors]}`}>
        {method}
      </span>
      <div className="flex-1">
        <code className="text-sm font-mono text-gray-800">{path}</code>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-green-500">✓</span>
      <span className="text-gray-700">{text}</span>
    </li>
  )
}
