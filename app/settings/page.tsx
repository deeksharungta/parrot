import React from "react";
import Header from "../components/ui/Header";
import YoloMode from "../components/settings/YoloMode";
import DisconnectNeynar from "../components/settings/DisconnectNeynar";
import Notifications from "../components/settings/Notifications";
import Navbar from "../components/ui/Navbar";

export default function SettingsPage() {
  return (
    <div className="p-5">
      <Header title="Settings" />
      <div className="flex flex-col gap-5 mt-9">
        <YoloMode />
        <DisconnectNeynar />
        <Notifications />
      </div>
      <Navbar />
    </div>
  );
}
