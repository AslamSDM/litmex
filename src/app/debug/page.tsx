'use client';

import Link from 'next/link';

export default function DebugIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Debug Panel
          </h1>
          <p className="text-gray-600 mb-6">
            Development tools for debugging the LitMex application.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <Link 
                href="/debug/referral-cache" 
                className="block text-blue-600 hover:text-blue-800"
              >
                <h2 className="text-xl font-semibold mb-2">Referral Cache Debug</h2>
                <p className="text-gray-600">
                  View and manage the referral cache data stored in browser storage.
                </p>
              </Link>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">API Endpoints</h2>
              <div className="space-y-2">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    GET /api/debug/referral-cache
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Get referral cache debug information
                  </p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    POST /api/debug/referral-cache
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Get cache clear instructions (send <code>{`{"action": "clear"}`}</code>)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Development Only</h3>
            <p className="text-yellow-700 text-sm">
              These debug tools are intended for development purposes only. 
              Make sure to remove or restrict access in production environments.
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              ← Back to Main App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
