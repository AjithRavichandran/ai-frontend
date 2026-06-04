// src/Canvas/Canvasnavbar/CanvasNavbar.js

import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {RotateCcw, RotateCw } from "lucide-react";
import { useCanvasStore } from "../CanvasStore";
import { useAuthStore } from "../../authStore"; // adjust the path if needed
import Logo from "../../PCL1.png"; // adjust path relative to this file
import { useState } from "react";
import SubscriptionLivePlanModal from "./SubscriptionLivePlanModal";
import { BACKEND_URL } from "../../config";
import NEFTPaymentModal from "./NEFTPaymentModal";

const CanvasNavbar = ({
  projectSlug,
viewMode,firstPage,onUndoPages,onRedoPages,canUndoPages,
canRedoPages,onUndoWorkflows,onRedoWorkflows,canUndoWorkflows,canRedoWorkflows,onSaveAll,hasChanges,zoom,setZoom,
}) => {

// inside CanvasNavbar
const hasUnsavedSchemaChanges = useCanvasStore((s) => s.hasUnsavedChanges());
const [showNEFT, setShowNEFT] = useState(false);
const tree = useCanvasStore((s) => s.tree);
const projectName = useCanvasStore((s) => s.projectName);
const activePageId = useCanvasStore((s) => s.activePageId);
const { user, isAuthChecked } = useAuthStore();
const navigate = useNavigate();
const razorpayProjectName = projectName?.trim() || "PCL Project";
const latestPlan = user?.liveusageplan;
const subscriptionStatus = latestPlan?.subscription_status?.status;
const subscriptionInfo = latestPlan?.subscription_status;
const daysLeft = subscriptionInfo?.days_left;
const [showLiveMenu, setShowLiveMenu] = useState(false);
// normalize states
const isActive = subscriptionStatus === "active";

const isExpiring = subscriptionStatus === "expiring";
const isGrace = subscriptionStatus === "grace";

const showDaysBadge = (isExpiring || isGrace) && daysLeft;

const daysBadgeText = isGrace
  ? `Grace period: ${daysLeft} day${daysLeft > 1 ? "s" : ""} left`
  : `Expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

const isExpired =
  subscriptionStatus === "expired" || !subscriptionStatus;

const [isProcessingPayment, setIsProcessingPayment] = useState(false);
const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

useEffect(() => {
  if (isAuthChecked && projectSlug) {
    // Refresh user to get liveusageplan for this project
    useAuthStore.getState().refreshUser(projectSlug);
  }
}, [isAuthChecked, projectSlug]);

const razorpayUserName =
  user?.full_name || user?.username || "User";

const razorpayUserEmail =
  user?.email || "";

const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
const undoConfig = {
    pages: { onUndo: onUndoPages, onRedo: onRedoPages, canUndo: canUndoPages, canRedo: canRedoPages },
    workflows: { onUndo: onUndoWorkflows, onRedo: onRedoWorkflows, canUndo: canUndoWorkflows, canRedo: canRedoWorkflows },
  };

  if (!firstPage) return null;

  const activeUndo = undoConfig[viewMode];

const handleUpgradeOrUpdate = async (plan) => {
  if (!projectSlug || !tree?.pages?.length) {
    alert("Cannot deploy: project or pages not loaded yet");
    return;
  }

  const activePage =
    tree.pages.find(p => p.id === activePageId) || tree.pages[0];

  if (!activePage?.name) {
    alert("Cannot deploy: active page has no name");
    return;
  }

  const pageSlug = activePage.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  // ✅ UPDATE LIVE (no payment)
  if (!plan && (isActive || isExpiring || isGrace)) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/payments/update-live/${projectSlug}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Live update failed");

      navigate(`/project-updated/${projectSlug}/${pageSlug}`, {
        state: { projectName: razorpayProjectName },
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    return;
  }

  // ✅ PAYMENT FLOW (subscribe / upgrade)
  handleUpgrade(plan);
};


const handlePreview = () => {
  if (!projectSlug || !tree?.pages?.length) {
    alert("Cannot preview: project or pages not loaded yet");
    return;
  }

  const activePage = tree.pages.find(p => p.id === activePageId) || tree.pages[0];

  if (!activePage?.name) {
    alert("Cannot preview: active page has no name");
    return;
  }

  const pageSlug = activePage.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  window.open(`/preview/${projectSlug}/${pageSlug}`, `preview_${projectSlug}`);
};

  const handleUpgrade = async (plan) => {
  if (isProcessingPayment) return;

  if (!process.env.REACT_APP_RAZORPAY_KEY) {
    alert("Razorpay key not loaded. Restart React.");
    return;
  }

  if (!projectSlug || !tree?.pages?.length) {
    alert("Cannot deploy: project or pages not loaded yet");
    return;
  }

  const activePage =
    tree.pages.find(p => p.id === activePageId) || tree.pages[0];

  if (!activePage?.name) {
    alert("Cannot deploy: active page has no name");
    return;
  }

  const pageSlug = activePage.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  try {
    setIsProcessingPayment(true);

    // 1️⃣ Create Razorpay order
    const res = await fetch(
      `${BACKEND_URL}/api/payments/create/${projectSlug}/create-order/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ plan }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Payment creation failed");

    // 2️⃣ Open Razorpay
    const rzp = new window.Razorpay({
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      name: razorpayProjectName,
      description: `Deploy "${razorpayProjectName}" live`,
      order_id: data.order_id,

      handler: async (response) => {
        try {
          // 3️⃣ Complete payment
          const completeRes = await fetch(
            `${BACKEND_URL}/api/payments/complete/${projectSlug}/payment-complete/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              },
              body: JSON.stringify({
                plan,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            }
          );

          const completeData = await completeRes.json();
          if (!completeRes.ok || completeData.error) {
            throw new Error(completeData.error || "Payment verification failed");
          }

// ✅ Refresh user for this project BEFORE UI checks
await useAuthStore.getState().refreshUser(projectSlug);

          navigate(`/deploy/success/${projectSlug}/${pageSlug}`, {
            state: { plan, projectName: razorpayProjectName },
          });
        } catch (err) {
          alert(err.message);
        }
      },

      prefill: {
        name: razorpayUserName,
        email: razorpayUserEmail,
      },

      notes: {
        project_slug: projectSlug,
        plan,
      },

      theme: { color: "#22c55e" },
    });

    rzp.open();
  } catch (err) {
    alert(err.message);
  } finally {
    setIsProcessingPayment(false);
  }
};

  

  return (
   <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-md border-b border-gray-800 flex items-center px-6 h-14">
  {/* Left: Logo */}
  <div className="flex justify-start">
    <img src={Logo} alt="Logo" className="h-8 w-auto object-contain" />
  </div>

  {/* Center: Zoom + Undo/Redo */}
  <div className="flex-1 flex justify-center items-center gap-3">
    <select
      value={zoom}
      onChange={(e) => setZoom(Number(e.target.value))}
      className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded text-sm"
    >
      {[50, 75, 100, 125, 150].map((z) => (
        <option key={z} value={z}>{z}%</option>
      ))}
    </select>

    {viewMode !== "datatypes" && (
      <>
        <button
          onClick={activeUndo?.onUndo}
          disabled={!activeUndo?.canUndo}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
            activeUndo?.canUndo
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          <RotateCcw size={16} /> Undo
        </button>

        <button
          onClick={activeUndo?.onRedo}
          disabled={!activeUndo?.canRedo}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
            activeUndo?.canRedo
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          <RotateCw size={16} /> Redo
        </button>
      </>
    )}
  </div>


  {/* Right: Save + Preview + Deploy/Upgrade buttons */}
<div className="flex justify-end items-center gap-3">

{showDaysBadge && (
  <div
    className={`flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition
      ${
        isGrace
          ? "bg-orange-500/15 text-orange-400 hover:bg-orange-500/25"
          : daysLeft <= 2
          ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
          : "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25"
      }
    `}
  >
    {daysBadgeText}
  </div>
)}



  <button
    onClick={onSaveAll}
    disabled={!hasChanges}
    className={`flex items-center gap-1 border px-3 py-1.5 rounded-md text-sm font-medium transition ${
      hasChanges
        ? "border-blue-400 text-blue-400 hover:bg-blue-800"
        : "border-gray-500 text-gray-500 cursor-not-allowed"
    }`}
  >
    Save All
  </button>

  <button
    onClick={handlePreview}
    className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium flex items-center"
  >
    Preview
  </button>

  <div className="relative">
  <button
    onClick={() => setShowLiveMenu((v) => !v)}
    disabled={!isAuthChecked}
    className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium
      ${
        !isAuthChecked
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
      }
    `}
  >
    Live
    <span className="text-xs">▾</span>
  </button>

  {showLiveMenu && (
    <div className="absolute right-0 mt-2 w-60 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">

      {/* Update live */}
{(isActive || isExpiring || isGrace) && (
  <button
    onClick={() => {
      setShowLiveMenu(false);
      setShowConfirmUpdate(true); // 👈 show popup
    }}
    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
  >
    Update Live Version
  </button>
)}

      {/* Subscribe / Upgrade */}
      {(isExpired || isGrace || isExpiring) && (
        <button
          onClick={() => {
            setShowLiveMenu(false);
            setShowPlans(true);
          }}
          className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-700"
        >
          Subscribe / Upgrade
        </button>
      )}
    </div>
  )}
</div>


{showConfirmUpdate && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl w-96 max-w-full flex flex-col gap-4 animate-fade-in">
      
      <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
        ⚠️ {hasUnsavedSchemaChanges ? "Cannot Update Live" : "Ready to Deploy?"}
      </h3>

      <p className="text-gray-300">
        {hasUnsavedSchemaChanges ? (
          <>
            You cannot update the live version right now because Preview Appdata's table or field names doesnt match the Live Appdata table or field names.
            <br />
            Please use the <strong>"Replace Datatypes Table and Field Name"</strong> button in the Live App Data panel
            to synchronize changes before updating live.
          </>
        ) : (
          <>
            Are you sure you want to update the live version of <span className="font-semibold">{projectName}</span>?
          </>
        )}
      </p>

      <div className="flex justify-end gap-4 mt-2">
        <button
          onClick={() => setShowConfirmUpdate(false)}
          className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            setShowConfirmUpdate(false);
            handleUpgradeOrUpdate(null);
          }}
          disabled={hasUnsavedSchemaChanges} 
          className={`px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 ${
            hasUnsavedSchemaChanges ? "cursor-not-allowed bg-gray-600 hover:bg-gray-600" : ""
          }`}
          title={hasUnsavedSchemaChanges ? "Replace table/field names before updating live" : ""}
        >
          {hasUnsavedSchemaChanges ? "Cannot Update" : "Yes, Update"}
        </button>
      </div>

    </div>
  </div>
)}




{isAuthChecked && showPlans && (isGrace || isExpired || isExpiring) && (
  <SubscriptionLivePlanModal
  projectSlug={projectSlug}
  hasUnsavedSchemaChanges={hasUnsavedSchemaChanges}
    onSelect={({ plan, method }) => {
  setShowPlans(false);

  if (method === "razorpay") {
    handleUpgradeOrUpdate(plan);
  }

  if (method === "neft") {
    setSelectedPlan(plan);
    setShowNEFT(true);
  }
}}
    onClose={() => setShowPlans(false)}
  />
)}


  </div>

{showNEFT && (
  <NEFTPaymentModal
    projectSlug={projectSlug}
   plan={selectedPlan}
    onClose={() => setShowNEFT(false)}
  />
)}
</nav>



  );
};

export default CanvasNavbar;
