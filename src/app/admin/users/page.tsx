import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
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
  });

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <div className="text-sm text-gray-500">Total: {users.length} users</div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {user.email || "No email"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.username || "No username"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.referralCode}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-1">
                      {user.evmAddress && (
                        <div className="text-gray-600">
                          EVM: {user.evmAddress.slice(0, 8)}...
                        </div>
                      )}
                      {user.solanaAddress && (
                        <div className="text-gray-600">
                          SOL: {user.solanaAddress.slice(0, 8)}...
                        </div>
                      )}
                      {user.walletAddress && (
                        <div className="text-gray-600">
                          Wallet: {user.walletAddress.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.verified
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.verified ? "Verified" : "Unverified"}
                      </span>
                      {user.evmVerified && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          EVM ✓
                        </span>
                      )}
                      {user.solanaVerified && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          SOL ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{user._count.purchases} purchases</span>
                      <span>{user._count.referrals} referrals</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
