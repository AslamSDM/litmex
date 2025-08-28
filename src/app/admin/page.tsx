import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminDashboard() {
  // Get comprehensive statistics
  const [
    userCount,
    totalRevenue,
    purchaseCount,
    verifiedUsers,
    pendingPurchases,
    completedPurchases,
    failedPurchases,
    users,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.purchase.aggregate({
      _sum: {
        paymentAmount: true,
      },
      where: {
        status: "COMPLETED",
      },
    }),
    prisma.purchase.count(),
    prisma.user.count({
      where: {
        verified: true,
      },
    }),
    prisma.purchase.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.purchase.count({
      where: {
        status: "COMPLETED",
      },
    }),
    prisma.purchase.count({
      where: {
        status: "FAILED",
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        email: true,
        username: true,
        walletAddress: true,
        evmAddress: true,
        solanaAddress: true,
        referralCode: true,
        verified: true,
        evmVerified: true,
        solanaVerified: true,
        _count: {
          select: {
            purchases: true,
            referrals: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Show latest 20 users
    }),
  ]);

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
          <p className="text-3xl font-bold text-white">{userCount}</p>
          <p className="text-xs text-gray-500 mt-1">{verifiedUsers} verified</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">
            Total Funds Collected
          </h3>
          <p className="text-3xl font-bold text-green-400">
            ${totalRevenue._sum.paymentAmount?.toFixed(2) || "0"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {completedPurchases} completed purchases
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Purchases</h3>
          <p className="text-3xl font-bold text-blue-400">{purchaseCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {pendingPurchases} pending
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">
            Failed Purchases
          </h3>
          <p className="text-3xl font-bold text-red-400">{failedPurchases}</p>
          <p className="text-xs text-gray-500 mt-1">
            {purchaseCount > 0
              ? ((failedPurchases / purchaseCount) * 100).toFixed(1)
              : 0}
            % failure rate
          </p>
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-8">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Recent Users</h2>
          <p className="text-sm text-gray-400">
            Latest {users.length} registered users
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Wallets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-white">
                        {user.email || "No email"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.username || "No username"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.referralCode}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-1">
                      {user.evmAddress && (
                        <div className="text-gray-400">
                          <span className="text-yellow-400">EVM:</span>{" "}
                          {user.evmAddress.slice(0, 8)}...
                        </div>
                      )}
                      {user.solanaAddress && (
                        <div className="text-gray-400">
                          <span className="text-purple-400">SOL:</span>{" "}
                          {user.solanaAddress.slice(0, 8)}...
                        </div>
                      )}
                      {user.walletAddress &&
                        !user.evmAddress &&
                        !user.solanaAddress && (
                          <div className="text-gray-400">
                            Wallet: {user.walletAddress.slice(0, 8)}...
                          </div>
                        )}
                      {!user.walletAddress &&
                        !user.evmAddress &&
                        !user.solanaAddress && (
                          <div className="text-gray-500">No wallet</div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.verified
                            ? "bg-green-900 text-green-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {user.verified ? "Verified" : "Unverified"}
                      </span>
                      <div className="flex space-x-1">
                        {user.evmVerified && (
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-yellow-900 text-yellow-300">
                            EVM
                          </span>
                        )}
                        {user.solanaVerified && (
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-purple-900 text-purple-300">
                            SOL
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex flex-col">
                      <span className="text-green-400">
                        {user._count.purchases} purchases
                      </span>
                      <span className="text-blue-400">
                        {user._count.referrals} referrals
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Purchase Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Completed</span>
              <span className="text-green-400 font-semibold">
                {completedPurchases}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pending</span>
              <span className="text-yellow-400 font-semibold">
                {pendingPurchases}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Failed</span>
              <span className="text-red-400 font-semibold">
                {failedPurchases}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">
            User Verification
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Verified Users</span>
              <span className="text-green-400 font-semibold">
                {verifiedUsers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Unverified Users</span>
              <span className="text-red-400 font-semibold">
                {userCount - verifiedUsers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Verification Rate</span>
              <span className="text-blue-400 font-semibold">
                {userCount > 0
                  ? ((verifiedUsers / userCount) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Platform Health
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-green-400 font-semibold">
                {purchaseCount > 0
                  ? ((completedPurchases / purchaseCount) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Revenue/User</span>
              <span className="text-blue-400 font-semibold">
                $
                {userCount > 0
                  ? (
                      (Number(totalRevenue._sum.paymentAmount) || 0) / userCount
                    ).toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Users with Purchases</span>
              <span className="text-purple-400 font-semibold">
                {users.filter((u) => u._count.purchases > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
