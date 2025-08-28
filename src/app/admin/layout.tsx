"use client";

import AdminGuard from "@/components/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-900">
        <nav className="bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-white">
                  Admin Panel
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/admin"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </a>
                {/* Commented out for now */}
                {/* 
                <a href="/admin/users" className="text-gray-300 hover:text-white">Users</a>
                <a href="/admin/purchases" className="text-gray-300 hover:text-white">Purchases</a>
                <a href="/admin/referrals" className="text-gray-300 hover:text-white">Referrals</a>
                */}
                <a
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Back to Site
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
