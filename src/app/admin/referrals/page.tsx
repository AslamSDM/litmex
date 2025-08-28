import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminReferralsPage() {
  // Get referral statistics
  const referralStats = await prisma.user.findMany({
    where: {
      referrals: {
        some: {},
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      referralCode: true,
      createdAt: true,
      _count: {
        select: {
          referrals: true,
        },
      },
      referrals: {
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          _count: {
            select: {
              purchases: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      referrals: {
        _count: "desc",
      },
    },
  });

  // Get referral payments
  const referralPayments = await prisma.referralPayment.findMany({
    include: {
      User: {
        select: {
          email: true,
          username: true,
          referralCode: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalReferrals = await prisma.user.count({
    where: {
      referrerId: {
        not: null,
      },
    },
  });

  const totalReferralPayments = referralPayments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Referrals Management
        </h1>
        <div className="text-sm text-gray-500">
          Total Referrals: {totalReferrals} | Total Payments:{" "}
          {totalReferralPayments.toFixed(4)} SOL
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Referral Leaderboard */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Referrers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrals
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referralStats.slice(0, 10).map((user) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count.referrals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Referral Payments */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Referral Payments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referralPayments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.User?.email || "No email"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {payment.User?.referralCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {payment.amount.toString()} {payment.paymentCurrency}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${payment.amountUsd.toString()} USD
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : payment.status === "PROCESSING"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Referral Tree */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Referral Tree</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referrer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referred Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Purchases
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referralStats.map((user) => (
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
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {user.referrals.slice(0, 3).map((referral) => (
                        <div key={referral.id} className="text-xs">
                          <span className="text-gray-900">
                            {referral.email || referral.username || "Anonymous"}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({referral._count.purchases} purchases)
                          </span>
                        </div>
                      ))}
                      {user.referrals.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{user.referrals.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.referrals.reduce(
                      (sum, r) => sum + r._count.purchases,
                      0
                    )}
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
