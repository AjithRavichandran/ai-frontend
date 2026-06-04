import React, { useState } from "react";
import { X, UploadCloud } from "lucide-react";
import { BACKEND_URL } from "../../config";
import { useNavigate } from "react-router-dom";

const NEFTPaymentModal = ({ projectSlug, plan, onClose }) => {  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
const [preview, setPreview] = useState(null);
const navigate = useNavigate(); // ✅ Add this
  
const submitPayment = async () => {
  if (!file) {
    alert("Please upload payment screenshot");
    return;
  }

  if (!plan) {
    alert("Plan missing. Please select a plan again.");
    return;
  }

  const formData = new FormData();
  formData.append("screenshot", file);
  formData.append("plan", plan); // ✅ FIX

  try {
    setLoading(true);
    const res = await fetch(
      `${BACKEND_URL}/api/payments/manual/${projectSlug}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Submission failed");

    // ✅ Instead of just closing modal, redirect to confirmation page
      navigate(`/payment-submitted/${projectSlug}`, {
        state: { message: "Our team will email you once the payment is verified!" },
      });
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="relative bg-gray-900 text-white w-[460px] rounded-2xl p-6 shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-cyan-400">
          Pay via NEFT / Bank Transfer
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Complete the transfer and upload the payment proof
        </p>

        {/* Step 1 */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-300 mb-2">
            1️⃣ Bank Details
          </p>

          <div className="bg-gray-800 rounded-xl p-4 grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-gray-400">Account Name</div>
            <div>PCL INFOTECH PRIVATE LIMITED</div>

            <div className="text-gray-400">Account No</div>
            <div>31970200001807</div>

            <div className="text-gray-400">IFSC</div>
            <div>BARBOTHIRUV</div>

            <div className="text-gray-400">Branch</div>
            <div>Thiruvallur, Chennai</div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-300 mb-2">
            2️⃣ Upload Payment Screenshot
          </p>

          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-gray-600 rounded-xl p-5 cursor-pointer hover:bg-gray-800 transition">
  {preview ? (
    <img
      src={preview}
      alt="Payment Screenshot Preview"
      className="max-h-40 rounded-lg border border-gray-700 object-contain"
    />
  ) : (
    <>
      <UploadCloud className="text-cyan-400" />
      <span className="text-sm text-gray-300">
        Click to upload screenshot
      </span>
      <span className="text-xs text-gray-500">
        JPG / PNG / WebP (max 5MB)
      </span>
    </>
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const selected = e.target.files[0];
      if (!selected) return;
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }}
    className="hidden"
  />
</label>

          <p className="text-xs text-yellow-400 mt-2">
            ⚠ Screenshot must clearly show amount & transaction ID
          </p>
        </div>

        {/* Info */}
        <div className="mt-4 bg-cyan-500/10 text-cyan-300 text-xs px-4 py-2 rounded-lg">
          ⏱ Verification usually takes 2–6 working hours. Your project will go
          live automatically after approval.
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>

          <button
            onClick={submitPayment}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit for Verification"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NEFTPaymentModal;