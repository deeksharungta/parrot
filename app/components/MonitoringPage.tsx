import { LoadingSpinner } from "./LoadingSpinner";

interface MonitoringPageProps {
  twitterUsername: string;
}

export function MonitoringPage({ twitterUsername }: MonitoringPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">📡</span>
        </div>
        <LoadingSpinner text="Fetching tweets" />
        <p className="text-gray-500 text-sm mt-4">
          Scanning @{twitterUsername}'s timeline...
        </p>
      </div>
    </div>
  );
}
