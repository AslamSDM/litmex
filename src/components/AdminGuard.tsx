"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const response = await fetch("/api/admin/check");
        console.log("Admin check response:", response);

        if (response.ok) {
          const data = await response.json();
          if (data.isAdmin) {
            setIsAdmin(true);
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        // router.push("/");
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Router will redirect
  }

  return <>{children}</>;
}
