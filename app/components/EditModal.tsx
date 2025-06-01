import { useState } from "react";

interface Tweet {
  id: string;
  content: string;
  twitter_created_at: string | null;
  twitter_url: string | null;
  cast_status: "pending" | "approved" | "rejected" | "cast" | "failed";
  is_edited: boolean;
}

interface EditModalProps {
  tweet: Tweet;
  onSave: (content: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function EditModal({
  tweet,
  onSave,
  onClose,
  isLoading,
}: EditModalProps) {
  const [content, setContent] = useState(tweet.content);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit tweet</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
            rows={5}
            maxLength={280}
          />

          <div className="flex items-center justify-between mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>💰</span>
              <span>Cost: 0.1 USDC</span>
            </div>
            <div className="text-xs text-gray-500">
              <span className={content.length > 250 ? "text-red-500" : ""}>
                {content.length}/280
              </span>
            </div>
          </div>

          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => onSave(content)}
              disabled={isLoading || content.length === 0}
              className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition-all text-sm"
            >
              {isLoading ? "Saving..." : "Cast now"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
