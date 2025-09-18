import React from "react";

export default function Features() {
  return (
    <div className="px-10 ">
      <h3 className="font-zing font-thin text-2xl text-center mb-9">
        Features
      </h3>
      <div className="grid grid-cols-3 gap-10 text-center">
        <div className="border-black border ">
          <h4 className="font-zing font-thin text-2xl">Pick and cast.</h4>
          <p className="font-serif font-normal text-sm">
            Choose your favorite posts and cast them instantly on FC. Stay in
            control of what you share and when.
          </p>
        </div>
        <div className="border-black border ">
          <h4 className="font-zing font-thin text-2xl">YOLO mode.</h4>
          <p className="font-serif font-normal text-sm">
            Turn on auto-cast and let the system post for you—no approvals
            needed. It stops when your allowance runs out.
          </p>
        </div>
        <div className="border-black border ">
          <h4 className="font-zing font-thin text-2xl">Micropayments.</h4>
          <p className="font-serif font-normal text-sm">
            Monitor your earnings and reach across all supported platforms in
            one place.
          </p>
        </div>
      </div>
    </div>
  );
}
