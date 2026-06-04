import React, { useState } from "react";
import { X, Check } from "lucide-react";

const PLANS = [
  {
    id: "1_month",
    label: "1 Month",
    price: "₹499",
    note: "Try it out",
  },
  {
    id: "6_months",
    label: "6 Months",
    price: "₹2799",
    note: "Save 7%",
  },
  {
    id: "12_months",
    label: "12 Months",
    price: "₹4999",
    note: "Best value",
    popular: true,
  },
];

export default function SubscriptionLivePlanModal({ onSelect, onClose, hasUnsavedSchemaChanges }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
const [paymentMethod, setPaymentMethod] = useState("razorpay");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-gray-900 text-white rounded-xl p-6 w-[420px] shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold text-center">
          Go Live 🚀
        </h2>
        <p className="text-sm text-gray-400 text-center mt-1">
          Choose a plan to deploy your project live
        </p>

        {/* Plans */}
        <div className="mt-6 space-y-3">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full rounded-xl border px-4 py-4 flex items-center justify-between transition
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/15"
                      : plan.popular
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-700 hover:bg-gray-800"
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{plan.label}</span>

                    {plan.popular && !isSelected && (
                      <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}

                    {isSelected && (
                      <Check size={16} className="text-blue-400" />
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-1">{plan.note}</p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold">{plan.price}</div>
                  <div className="text-xs text-gray-400">One-time</div>
                </div>
              </button>
              
            );
          })}
          {/* Payment Method */}
<div className="mt-5">
  <p className="text-sm text-gray-400 mb-2">Payment Method</p>

  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => setPaymentMethod("razorpay")}
      className={`px-4 py-3 rounded-lg border text-sm font-medium transition
        ${
          paymentMethod === "razorpay"
            ? "border-blue-500 bg-blue-500/15"
            : "border-gray-700 hover:bg-gray-800"
        }`}
    >
      Razorpay
    </button>

    <button
      onClick={() => setPaymentMethod("neft")}
      className={`px-4 py-3 rounded-lg border text-sm font-medium transition
        ${
          paymentMethod === "neft"
            ? "border-green-500 bg-green-500/15"
            : "border-gray-700 hover:bg-gray-800"
        }`}
    >
      NEFT / Bank Transfer
    </button>
  </div>
</div>
        </div>
{hasUnsavedSchemaChanges && (
  <div className="mt-4 text-sm text-orange-400 bg-orange-500/10 px-4 py-2 rounded-lg">
    ⚠️ Replace Datatypes table/field names before proceeding which is in
    <strong> Live App Data</strong>
  </div>
)}

        {/* Proceed Button */}
        <button
  disabled={!selectedPlan || hasUnsavedSchemaChanges}
  onClick={() => {
    if (hasUnsavedSchemaChanges) return;

    onSelect({
      plan: selectedPlan,
      method: paymentMethod,
    });
  }}
  className={`mt-6 w-full py-3 rounded-lg font-semibold transition
    ${
      selectedPlan && !hasUnsavedSchemaChanges
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-gray-700 text-gray-400 cursor-not-allowed"
    }`}
>
  {hasUnsavedSchemaChanges
    ? "Fix Live Appdata to Proceed"
    : "Proceed to Payment →"}
</button>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-400">
          🔒 Secure payment via Razorpay
        </div>
      </div>
    </div>
  );
}
