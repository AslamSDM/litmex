import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminPurchasesPage() {
  const purchases = await prisma.purchase.findMany({
    include: {
      user: {
        select: {
          id: true,
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

  const totalRevenue = purchases
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.paymentAmount), 0);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Purchases Management
        </h1>
        <div className="text-sm text-gray-500">
          Total: {purchases.length} purchases | Revenue: $
          {totalRevenue.toFixed(2)}
        </div>
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
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Network
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.user?.email || "No email"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {purchase.user?.username || "No username"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {purchase.user?.referralCode}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.paymentAmount.toString()}{" "}
                        {purchase.paymentCurrency}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${purchase.pricePerLmxInUsdt.toString()}/LMX
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.lmxTokensAllocated.toString()} LMX
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.network === "SOLANA"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {purchase.network}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : purchase.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : purchase.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500 max-w-32 truncate">
                      {purchase.transactionSignature}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(purchase.createdAt).toLocaleDateString()}
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
