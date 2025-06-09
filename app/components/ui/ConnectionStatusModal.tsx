import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";

interface ConnectionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "connected" | "disconnected";
}

export function ConnectionStatusModal({
  isOpen,
  onClose,
  status,
}: ConnectionStatusModalProps) {
  const isConnected = status === "connected";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/20 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className="fixed bottom-2 left-2 right-2 bg-white rounded-[32px] border border-[#ECECED] z-50 max-h-[80vh] overflow-hidden p-6"
          >
            <div className="flex flex-col items-center text-center">
              {/* Success/Disconnection Icon */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isConnected ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {isConnected ? (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-green-600"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22,4 12,14.01 9,11.01" />
                  </svg>
                ) : (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-red-600"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#100c20] mb-2">
                {isConnected ? "You're Connected!" : "You're Disconnected"}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#8C8A94] mb-6">
                {isConnected
                  ? "Your Neynar signer has been successfully connected. You can now cast tweets."
                  : "Your Neynar signer has been disconnected. You'll need to reconnect to cast tweets."}
              </p>

              {/* Continue Button */}
              <Button className="w-full" onClick={onClose} variant="primary">
                Continue
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
