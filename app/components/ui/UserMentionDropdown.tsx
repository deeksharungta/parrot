import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FarcasterUser } from "@/hooks/useUserSearch";

interface UserMentionDropdownProps {
  users: FarcasterUser[];
  isVisible: boolean;
  onUserSelect: (user: FarcasterUser) => void;
  position?: { top: number; left: number };
}

export default function UserMentionDropdown({
  users,
  isVisible,
  onUserSelect,
  position = { top: 0, left: 0 },
}: UserMentionDropdownProps) {
  if (!isVisible || users.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 w-full max-w-xs bg-white border border-[#ECECED] rounded-xl shadow-lg max-h-48 overflow-y-auto"
        style={{
          top: position.top + 8,
          left: position.left,
        }}
      >
        <div className="p-2">
          {users.map((user) => (
            <button
              key={user.fid}
              onClick={() => onUserSelect(user)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Image
                src={user.pfp_url || "/default-avatar.png"}
                alt={user.display_name}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[#100C20] truncate">
                  {user.display_name}
                </div>
                <div className="text-xs text-[#8C8A94] truncate">
                  @{user.username}
                </div>
              </div>
              {user.power_badge && (
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 1L6.545 3.09L9 3.545L7.5 5.727L7.909 8.182L5 6.909L2.091 8.182L2.5 5.727L1 3.545L3.455 3.09L5 1Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
