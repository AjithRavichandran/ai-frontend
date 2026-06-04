import React from "react";

export default function CanvasPaymentEditor({ 
  closePaymentEditor, 
  setCanEdit, 
  paymentOpenedRef 
}) {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[420px] shadow-2xl">

        {/* HEADER */}
        <h2 className="text-xl font-semibold mb-1 text-gray-900">
          Unlock Editing Features
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          Upgrade your plan to drag, edit, and customize elements in your app.
        </p>

        {/* PRICING OPTIONS */}
        <div className="space-y-3 mb-6">

          {/* MONTHLY */}
          <div className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-800">Monthly Plan</p>
              <p className="text-xs text-gray-500">Billed monthly</p>
            </div>
            <p className="text-lg font-semibold text-gray-900">₹499 / month</p>
          </div>

          {/* YEARLY */}
          <div className="border-2 border-blue-600 rounded-lg p-4 flex justify-between items-center bg-blue-50">
            <div>
              <p className="text-sm font-medium text-gray-800">Yearly Plan</p>
              <p className="text-xs text-green-600 font-medium">
                Save 20% annually
              </p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              ₹4,999 / year
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm border rounded-md text-gray-600 hover:bg-gray-50"
            onClick={closePaymentEditor}
          >
            Not now
          </button>

          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => {
              setCanEdit(true);                 // ✅ allow editing
              closePaymentEditor();             // close popup
              paymentOpenedRef.current = false; // reset lock
            }}
          >
            Upgrade Now
          </button>
        </div>

      </div>
    </div>
  );
}
