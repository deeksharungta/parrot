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
                width="339"
                height="9"
                viewBox="0 0 339 9"
                fill="none"
              >
                <path
                  d="M0.542969 8L6.83464 4.5C10.7468 2.3237 15.5058 2.3237 19.418 4.5V4.5C23.3301 6.6763 28.0891 6.6763 32.0013 4.5V4.5C35.9134 2.3237 40.6725 2.3237 44.5846 4.5V4.5C48.4968 6.6763 53.2558 6.6763 57.168 4.5V4.5C61.0801 2.3237 65.8391 2.3237 69.7513 4.5V4.5C73.6634 6.6763 78.4225 6.6763 82.3346 4.5V4.5C86.2468 2.3237 91.0058 2.3237 94.918 4.5V4.5C98.8301 6.6763 103.589 6.6763 107.501 4.5V4.5C111.413 2.3237 116.172 2.32371 120.085 4.5V4.5C123.997 6.67629 128.756 6.6763 132.668 4.5V4.5C136.58 2.3237 141.339 2.32371 145.251 4.5V4.5C149.163 6.67629 153.922 6.6763 157.835 4.5V4.5C161.747 2.3237 166.506 2.32371 170.418 4.5V4.5C174.33 6.67629 179.089 6.6763 183.001 4.5V4.5C186.913 2.3237 191.672 2.32371 195.585 4.5V4.5C199.497 6.67629 204.256 6.67629 208.168 4.5V4.5C212.08 2.3237 216.839 2.3237 220.751 4.5V4.5C224.663 6.6763 229.422 6.67629 233.335 4.5V4.5C237.247 2.32371 242.006 2.32371 245.918 4.5V4.5C249.83 6.67629 254.589 6.6763 258.501 4.5V4.5C262.413 2.3237 267.202 2.34012 271.114 4.51641V4.51641C274.99 6.67239 279.734 6.68865 283.609 4.53267L283.899 4.37148C287.659 2.2801 292.268 2.33272 295.994 4.48375V4.48375C299.745 6.64955 304.395 6.66581 308.146 4.5V4.5C311.897 2.33419 316.519 2.33419 320.271 4.5V4.5C324.022 6.66581 328.644 6.66581 332.395 4.5L338.457 1"
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
            <Button
              className="mt-6"
              onClick={() => window.open("/auth", "_blank")}
            >
              Connect with Neynar
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
