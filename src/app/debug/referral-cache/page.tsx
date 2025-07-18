"use client";

import { useEffect, useState } from "react";
import useReferralHandling, {
  useReferralStore,
} from "@/components/hooks/useReferralHandling";

interface CacheData {
  referralCode: string | null;
  referrerId: string | null;
  referrerAddress: string | null;
  referrerUsername: string | null;
  isValid: boolean;
  lastUpdated: number;
  processedCodes: string[];
  failedCodes: string[];
  wallet: boolean;
}

export default function ReferralCacheDebugPage() {
  const [mounted, setMounted] = useState(false);
  const [rawStorageData, setRawStorageData] = useState<string | null>(null);
  const [parsedStorageData, setParsedStorageData] = useState<CacheData | null>(
    null
  );
  const [storageError, setStorageError] = useState<string | null>(null);
  const ref = useReferralHandling();
  // Get data from Zustand store
  const storeData = useReferralStore();

  useEffect(() => {
    setMounted(true);

    // Access raw localStorage data
    try {
      const rawData = localStorage.getItem("referral-storage");
      setRawStorageData(rawData);

      if (rawData) {
        const parsed = JSON.parse(rawData);
        // Extract the state from Zustand's storage format
        const state = parsed.state || parsed;
        setParsedStorageData(state);
      }
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Unknown error");

      // Try sessionStorage as fallback
      try {
        const sessionData = sessionStorage.getItem("referral-storage");
        if (sessionData) {
          setRawStorageData(sessionData);
          const parsed = JSON.parse(sessionData);
          const state = parsed.state || parsed;
          setParsedStorageData(state);
          setStorageError(null);
        }
      } catch (sessionError) {
        console.error(
          "Failed to access both localStorage and sessionStorage:",
          sessionError
        );
      }
    }
  }, []);

  const clearCache = () => {
    try {
      localStorage.removeItem("referral-storage");
      sessionStorage.removeItem("referral-storage");
      storeData.clearReferralData();
      setRawStorageData(null);
      setParsedStorageData(null);
      alert("Cache cleared successfully!");
    } catch (error) {
      alert(
        "Failed to clear cache: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const resetFailedCodes = () => {
    storeData.resetFailedCodes();
    alert("Failed codes reset successfully!");
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Referral Cache Debug Panel
          </h1>
          <p className="text-gray-600 mb-6">
            This page displays the current state of the referral cache data
            stored in your browser.
          </p>

          <div className="flex gap-4 mb-6">
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Clear Cache
            </button>
            <button
              onClick={resetFailedCodes}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Reset Failed Codes
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Zustand Store Data */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Current Zustand Store State
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Referral Code
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {storeData.referralCode || "None"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Referrer ID
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {storeData.referrerId || "None"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Referrer Address
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded break-all">
                  {storeData.referrerAddress || "None"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Referrer Username
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {storeData.referrerUsername || "None"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Is Valid
                </label>
                <p
                  className={`p-2 rounded ${storeData.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {storeData.isValid ? "Valid" : "Invalid"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wallet Mode
                </label>
                <p
                  className={`p-2 rounded ${storeData.wallet ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {storeData.wallet ? "Wallet Browser" : "Regular Browser"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {formatTimestamp(storeData.lastUpdated)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cache Age
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {storeData.lastUpdated
                    ? `${Math.round((Date.now() - storeData.lastUpdated) / 1000 / 60)} minutes ago`
                    : "No data"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processed Codes
              </label>
              <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                {storeData.processedCodes.length > 0 ? (
                  <ul className="space-y-1">
                    {storeData.processedCodes.map((code, index) => (
                      <li
                        key={index}
                        className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No processed codes</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Failed Codes
              </label>
              <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                {Array.from(storeData.failedCodes).length > 0 ? (
                  <ul className="space-y-1">
                    {Array.from(storeData.failedCodes).map((code, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No failed codes</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Raw Storage Data */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Raw Storage Data
          </h2>

          {storageError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Storage Error:</strong> {storageError}
            </div>
          )}

          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
            <pre>{rawStorageData || "No storage data found"}</pre>
          </div>
        </div>

        {/* Parsed Storage Data */}
        {parsedStorageData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Parsed Storage Data
            </h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{JSON.stringify(parsedStorageData, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Current URL Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Current URL Info
          </h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current URL
              </label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded break-all">
                {typeof window !== "undefined" ? window.location.href : "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Referral Parameter
              </label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">
                {typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get(
                      "referral"
                    ) || "None"
                  : "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Wallet Parameter
              </label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">
                {typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get("wallet") ||
                    "None"
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
