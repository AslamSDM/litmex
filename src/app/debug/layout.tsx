import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Debug Panel - LitMex',
  description: 'Debug tools for LitMex application',
  robots: 'noindex, nofollow', // Prevent search engines from indexing debug pages
};

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="debug-layout">
      {/* Add debug header if needed */}
      <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-center text-sm text-yellow-800">
        ⚠️ Debug Mode - This page is for development purposes only
      </div>
      {children}
    </div>
  );
}
