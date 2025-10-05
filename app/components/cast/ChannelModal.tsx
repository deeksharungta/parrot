import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Cross from "../icons/Cross";
import Button from "../ui/Button";
import Search from "../icons/Search";
import { useGetUserMemberships } from "../../../hooks/useUserMemberships";

interface Channel {
  id: string;
  name: string;
  icon?: string;
  userCount?: string;
  description?: string;
  image_url?: string;
}

interface ChannelModalProps {
  channel: string;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

// Default channels that are always available
const defaultChannels: Channel[] = [
  { id: "home", name: "Home", icon: "🏠", userCount: "" },
];

export default function ChannelModal({
  channel,
  isOpen,
  onClose,
  isLoading,
}: ChannelModalProps) {
  const [selectedChannel, setSelectedChannel] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user memberships for FID 369341
  const {
    memberships,
    isLoading: membershipsLoading,
    error: membershipsError,
  } = useGetUserMemberships({
    fid: 369341,
    limit: 50,
  });

  // Transform memberships data to match our Channel interface
  const userChannels: Channel[] =
    memberships?.map((membership) => ({
      id: membership.channel.id,
      name: membership.channel.name,
      description: membership.channel.description,
      image_url: membership.channel.image_url,
      userCount: membership.channel.member_count
        ? `${membership.channel.member_count} members`
        : "",
    })) || [];

  // Combine default channels with user channels
  const allChannels = [...defaultChannels, ...userChannels];

  const filteredChannels = allChannels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectChannel = () => {
    console.log("Select channel:", selectedChannel);
  };
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
            className="fixed bg-white border border-[#ECECED] z-50 max-h-[85vh] overflow-hidden bottom-2 left-2 right-2 rounded-[32px] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[#100c20] text-base">
                Select channel
              </h3>
              <button
                onClick={onClose}
                className="p-1 -m-1 touch-manipulation"
                disabled={isLoading}
              >
                <Cross />
              </button>
            </div>

            <div className="overflow-hidden my-4">
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
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search />
              </div>
              <input
                type="text"
                placeholder="Search channels.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#f8f8f8] rounded-xl border-none text-sm placeholder-[#B3B1B8] focus:outline-none focus:ring-0 focus:ring-offset-0"
              />
            </div>
            <div className="space-y-2 mb-6">
              {membershipsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-[#8C8A94]">
                    Loading channels...
                  </div>
                </div>
              ) : membershipsError ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-red-500">
                    Error loading channels: {membershipsError.message}
                  </div>
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-[#8C8A94]">
                    No channels found
                  </div>
                </div>
              ) : (
                filteredChannels.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`flex items-center justify-between cursor-pointer transition-colors px-3 py-2 rounded-xl ${
                      selectedChannel === ch.id
                        ? "bg-[#F3F3F4] border border-[#D9D8DC]"
                        : "bg-[#f8f8f8] hover:bg-[#F3F3F4] border hover:border-[#D9D8DC] border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {ch.image_url ? (
                        <img
                          src={ch.image_url}
                          alt={ch.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="text-lg">{ch.icon || "📺"}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-[#494656] text-sm">
                          {ch.name}
                        </span>
                        {ch.description && (
                          <span className="text-xs text-[#8C8A94] truncate max-w-[200px]">
                            {ch.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {ch.userCount && (
                      <span className="text-xs text-[#8C8A94]">
                        {ch.userCount}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleSelectChannel}
                disabled={isLoading}
                isLoading={isLoading}
                className="flex-1"
              >
                Select{" "}
                {allChannels.find((ch) => ch.id === selectedChannel)?.name ||
                  "Home"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
