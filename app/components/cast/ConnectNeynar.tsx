import { motion, AnimatePresence } from "framer-motion";
import Cross from "../icons/Cross";
import Button from "../ui/Button";

interface ConnectNeynarProps {
  onClose: () => void;
  isOpen: boolean;
}

export function ConnectNeynar({ onClose, isOpen }: ConnectNeynarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/20 z-40 backdrop-blur-sm"
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
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#100c20]">
                Connect with Neynar
              </h3>
              <button onClick={onClose}>
                <Cross />
              </button>
            </div>
            <p className="text-sm text-[#8C8A94]">
              to cast tweets, we need access to your Neynar signer
            </p>
            <div className="my-6 overflow-hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="304"
                height="7"
                viewBox="0 0 304 7"
                fill="none"
              >
                <path
                  d="M1 1L7.29164 4.49999C11.2038 6.67629 15.9628 6.6763 19.875 4.5V4.5C23.7871 2.3237 28.5462 2.3237 32.4583 4.5V4.5C36.3705 6.67629 41.1295 6.6763 45.0416 4.5V4.5C48.9538 2.3237 53.7128 2.3237 57.625 4.5V4.5C61.5371 6.6763 66.2961 6.6763 70.2083 4.5V4.5C74.1204 2.3237 78.8795 2.3237 82.7916 4.5V4.5C86.7038 6.6763 91.4628 6.6763 95.375 4.5V4.5C99.2871 2.3237 104.046 2.3237 107.958 4.5V4.5C111.87 6.6763 116.629 6.6763 120.542 4.5V4.5C124.454 2.3237 129.213 2.3237 133.125 4.5V4.5C137.037 6.6763 141.796 6.6763 145.708 4.5V4.5C149.62 2.3237 154.379 2.3237 158.292 4.5V4.5C162.204 6.6763 166.963 6.6763 170.875 4.5V4.5C174.787 2.3237 179.546 2.3237 183.458 4.5V4.5C187.37 6.6763 192.129 6.6763 196.042 4.5V4.5C199.954 2.3237 204.713 2.3237 208.625 4.5V4.5C212.537 6.6763 217.296 6.6763 221.208 4.5V4.5C225.12 2.3237 229.879 2.3237 233.792 4.5V4.5C237.704 6.6763 242.463 6.6763 246.375 4.5V4.5C250.287 2.3237 255.046 2.3237 258.958 4.5V4.5C262.87 6.6763 267.63 6.6763 271.542 4.5V4.5C275.454 2.3237 280.213 2.3237 284.125 4.5V4.5C288.037 6.6763 292.796 6.6763 296.708 4.5L303 1"
                  stroke="#E2E2E4"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1 bg-[#E4FCFF] rounded-xl p-3">
              <p className="text-sm font-medium text-[#0B92F9]">
                Secure Authentication
              </p>
              <p className="text-sm font-light text-[#0BABFB]">
                You'll be redirected to Neynar to securely authorize xCast. This
                allows us to cast on your behalf without storing sensitive keys.
              </p>
            </div>
            <Button className="mt-6">Connect with Neynar</Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
