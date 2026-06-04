import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCanvasStore } from "./Canvas/CanvasStore";
import { useAuthStore } from "./authStore";
import { BACKEND_URL } from "./config";

export default function AIPromptPage() {
  const [projectName, setProjectName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [charactersCount, setCharactersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState("");
  const [error, setError] = useState("");
const { user, isAuthChecked } = useAuthStore();
const [successMsg, setSuccessMsg] = useState("");
const [showNEFT, setShowNEFT] = useState(false);
const [selectedPlan, setSelectedPlan] = useState(null);
const [neftFile, setNeftFile] = useState(null);
const [isUploading, setIsUploading] = useState(false);
const setSchema = useCanvasStore((s) => s.setTree); // schema = tree
const setDatatypes = useCanvasStore((s) => s.setDatatypes);
const setWorkflows = useCanvasStore((s) => s.setWorkflows);
const { accessToken, refreshAccessToken } = useAuthStore();
const [promptsLeft, setPromptsLeft] = useState(null);
const [showPlans, setShowPlans] = useState(false);
const [isPaying, setIsPaying] = useState(false);
 
useEffect(() => {
  if (!successMsg) return;
  const t = setTimeout(() => setSuccessMsg(""), 5000);
  return () => clearTimeout(t);
}, [successMsg]);

const handleBuyPrompts = async (plan) => {
  if (isPaying) return;

  try {
    setIsPaying(true);
    const token = accessToken || (await refreshAccessToken());

    // 1️⃣ Create order
    const res = await fetch(
      `${BACKEND_URL}/api/payments/platform-create-order/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }), // starter / pro
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order failed");

    // 2️⃣ Razorpay popup
    const rzp = new window.Razorpay({
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: data.amount, // already in paise

      currency: "INR",
      name: "AI Prompt Pack",
      description: `${data.credits} AI Prompts`,
      order_id: data.order_id,

      handler: async (response) => {
        // 3️⃣ Complete payment
        const completeRes = await fetch(
          `${BACKEND_URL}/api/payments/platform-payment-complete/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          }
        );

        const completeData = await completeRes.json();
        if (!completeRes.ok) {
          throw new Error(completeData.error || "Payment verification failed");
        }

        // 4️⃣ Refresh usage
        setPromptsLeft((prev) => prev + completeData.credits_added);
        setShowPlans(false);
        setSuccessMsg(`🎉 ${completeData.credits_added} prompts added successfully!`);
      },

      theme: { color: "#3b82f6" },
    });

    rzp.open();
  } catch (err) {
    alert(err.message);
  } finally {
    setIsPaying(false);
  }
};

useEffect(() => {
  const fetchUsage = async () => {
    if (!accessToken) return;

    try {
      const token = accessToken || (await refreshAccessToken());

      const res = await fetch(
        `${BACKEND_URL}/api/payments/platform-usage/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      setPromptsLeft(data.total_left);
    } catch (err) {
      console.error("Usage fetch failed", err);
    }
  };

  fetchUsage();
}, [accessToken, refreshAccessToken]);


  const navigate = useNavigate();

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setCharactersCount(e.target.value.length);
  };

  const handleGenerateClick = async () => {
    console.log("User object:", user);
  if (!prompt.trim() || !projectName.trim()) {
    setError("Project name and prompt are required");
    return;
  }

  // ⏳ Wait until auth check finishes
  if (!isAuthChecked) return;

  // 🚫 Not logged in
  if (!user) {
    navigate("/login", { state: { from: "/prompt" } });
    return;
  }

  setIsLoading(true);
  setError("");

  try {
    let token = accessToken || (await refreshAccessToken());
    if (!token) throw new Error("Please login again");

    const isSuperTest = Boolean(user?.is_superuser) && prompt.trim().toLowerCase() === "test";
const apiEndpoint = isSuperTest
  ? `${BACKEND_URL}/api/generate/test2/`
  : `${BACKEND_URL}/api/generate/ai/`;

console.log("Superuser test mode:", isSuperTest, "Prompt:", prompt.trim());

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        project_name: projectName.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to generate blueprint");
    }

    // Success: handle response
    console.log("AI generate response:", data);

    // Update promptsLeft only if normal API (optional)
    if (!isSuperTest) {
      setPromptsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }

    setSchema(data.schema);
    setDatatypes(data.datatypes || []);
    setWorkflows(data.workflows || []);

    const store = useCanvasStore.getState();
    store.setAppdata({
      ...data.appdata,
      projectName: data.project_name,
      projectId: data.project_id,
    });
    store.setLiveAppdata({
      ...data.liveappdata,
      projectName: data.project_name,
      projectId: data.project_id,
    });

    const timestamp = Date.now();
    navigate(`/editor/${data.project_slug}?t=${timestamp}`);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleUploadNEFT = async () => {
  if (!neftFile || !selectedPlan) return;

  try {
    setIsUploading(true);

    const token = accessToken || (await refreshAccessToken());

    const formData = new FormData();
    formData.append("pack", selectedPlan); // ✅ MUST be "pack"
    formData.append(
      "platform_neft_screenshot",
      neftFile
    ); // ✅ MUST match backend

    const res = await fetch(
      `${BACKEND_URL}/api/payments/neft-upload/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");

    setSuccessMsg("✅ NEFT submitted. Prompts will be credited after verification.");
    setShowNEFT(false);
    setNeftFile(null);
    setShowPlans(false);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsUploading(false);
  }
};


useEffect(() => {
    document.title = "Build with AI | PCL Infotech";
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const i = setInterval(
      () => setLoadingDots((p) => (p.length >= 3 ? "" : p + ".")),
      500
    );
    return () => clearInterval(i);
  }, [isLoading]);

  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="w-[420px] p-10 rounded-2xl bg-gray-900/70 backdrop-blur border border-gray-700 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Generating{loadingDots}
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            This may take 30s – 2 mins
          </p>
          <div className="mt-6 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-blue-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
<div className="min-h-screen flex items-center justify-center 
  bg-gradient-to-br from-black via-gray-900 to-black px-4">
<div className="w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden
  bg-gradient-to-br from-gray-700 to-gray-800
  border border-gray-600">

  
  <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-400" />


        <div className="p-10">
         {showPlans && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl 
      bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
      border border-gray-700 shadow-2xl p-8 animate-fade-in">

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white">
          Upgrade Your Prompts 🚀
        </h3>
        <p className="text-gray-400 mt-2 text-sm">
          Choose a pack to keep building with AI
        </p>
      </div>

     <div className="space-y-6">

  {/* ================= STARTER ================= */}
  <div className="p-5 rounded-2xl bg-gray-800 border border-gray-700">
    <div className="flex justify-between items-center mb-4">
      <div>
        <p className="text-lg font-semibold text-white">Starter Pack</p>
        <p className="text-gray-400 text-sm">5 Prompts</p>
      </div>
      <p className="text-blue-400 font-bold text-lg">₹500</p>
    </div>

    <div className="flex gap-3">

            {/* NEFT */}
      <button
        onClick={() => {
          setSelectedPlan("starter");
          setShowNEFT(true);
        }}
        className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold"
      >
        NEFT
      </button>

{/* Razorpay - disabled */}
<button
  disabled
  title="Razorpay integration coming soon 🚧"
  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold cursor-not-allowed opacity-70"
>
  Razorpay (Coming Soon)
</button>


    </div>
    
  </div>

  {/* ================= PRO ================= */}
  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 text-white relative">
    <span className="absolute -top-3 right-4 text-xs bg-yellow-400 text-black px-3 py-1 rounded-full font-semibold">
      Best Value
    </span>

    <div className="flex justify-between items-center mb-4">
      <div>
        <p className="text-lg font-semibold">Pro Pack</p>
        <p className="text-blue-100 text-sm">10 Prompts</p>
      </div>
      <p className="font-bold text-lg">₹1000</p>
    </div>

    <div className="flex gap-3">

      
      {/* NEFT */}
      <button
        onClick={() => {
          setSelectedPlan("pro");
          setShowNEFT(true);
        }}
        className="flex-1 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm"
      >
        NEFT
      </button>
      
{/* Razorpay - disabled */}
<button
  disabled
  title="Razorpay integration coming soon 🚧"
  className="flex-1 py-2 rounded-xl bg-white text-blue-700 font-semibold text-sm cursor-not-allowed opacity-70"
>
  Razorpay (Coming Soon)
</button>
      
    </div>
    
  </div>
      </div>
{showNEFT && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl 
      bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
      border border-gray-700 shadow-2xl p-8">

      <h3 className="text-xl font-bold text-white text-center mb-4">
        NEFT Payment Details
      </h3>

      <p className="text-center text-sm text-gray-400 mb-6">
        You selected:
        <span className="text-white font-semibold ml-1">
          {selectedPlan === "pro"
            ? "Pro Pack (₹1000 - 10 Prompts)"
            : "Starter Pack (₹500 - 5 Prompts)"}
        </span>
      </p>

      <div className="text-gray-300 text-sm space-y-3">

        <div>
          <p className="text-gray-400">Account Name</p>
          <p className="font-semibold">PCL INFOTECH PRIVATE LIMITED</p>
        </div>

        <div>
          <p className="text-gray-400">Account Number</p>
          <p className="font-semibold">31970200001807</p>
        </div>

        <div>
          <p className="text-gray-400">IFSC Code</p>
          <p className="font-semibold">BARBOTHIRUV</p>
        </div>

        <div>
          <p className="text-gray-400">Branch</p>
          <p className="font-semibold">THIRUVALLUR, Chennai</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        After transferring, upload the screenshot below.
      </p>
      <p className="text-xs text-gray-400 text-center">
        Prompts will be credited manually after verification.
      </p>

      <div className="mt-6">
  <label className="text-gray-200 font-medium mb-2 block">
    Upload NEFT Screenshot
  </label>

<div
  className="flex flex-col items-center justify-center
    border-2 border-dashed border-gray-500 rounded-xl p-6
    hover:border-blue-500 hover:bg-gray-800 transition relative"
>
    {neftFile ? (
      <img
        src={URL.createObjectURL(neftFile)}
        alt="NEFT Screenshot"
        className="max-h-48 object-contain rounded-lg"
      />
    ) : (
      <p className="text-gray-400 text-sm text-center">
        Drag & drop image here or click to browse
      </p>
    )}
   <input
  type="file"
  accept="image/*"
  id="neft-input"
  onChange={(e) => setNeftFile(e.target.files[0])}
  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
/>
  </div>

  {neftFile && (
    <div className="flex justify-between items-center mt-2 text-gray-200 text-sm">
      <span>{neftFile.name}</span>
      <button
        onClick={() => setNeftFile(null)}
        className="text-red-400 hover:text-red-500 font-semibold"
      >
        Remove
      </button>
    </div>
  )}

  <button
    onClick={handleUploadNEFT}
    disabled={!neftFile || isUploading}
    className="mt-4 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition"
  >
    {isUploading ? "Uploading..." : "Submit"}
  </button>
</div>
    </div>
  </div>
)}
      {/* Footer */}
      <button
        onClick={() => !isPaying && setShowPlans(false)}
        className="mt-6 w-full text-sm text-gray-400 hover:text-white transition"
      >
        Maybe later
      </button>
    </div>
  </div>
)}

          <h1 className="text-4xl font-bold text-white text-center">
  Build with AI
</h1>

<div className="h-0.5 w-12 bg-blue-500/70 rounded-full mx-auto mt-3" />

<p className="text-gray-400 text-center mt-4">
  Describe your idea and get a working blueprint instantly
</p>


{successMsg && (
  <div className="mt-6 bg-green-900/40 border border-green-500 
    text-green-200 px-4 py-3 rounded-xl text-center">
    {successMsg}
  </div>
)}


{/* Global errors (excluding Project Name errors) */}
{error && !error.includes("Project name") && (
  <div className="mt-6 relative bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-center animate-fade-in">
    {error}
    <button
      onClick={() => setError("")}
      className="absolute top-1 right-2 text-red-200 hover:text-white font-bold"
    >
      ×
    </button>
  </div>
)}

          {/* Project Name */}
<div className="mt-8">
  <label className="text-gray-300 font-medium mb-2 block">
    Project Name
  </label>
  <input
    value={projectName}
    onChange={(e) => setProjectName(e.target.value)}
    placeholder="e.g. Task Management App"
    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none
      ${error && error.includes("Project name")
        ? "border-red-500 focus:ring-red-500 bg-gray-800 text-white"
        : "border-gray-700 bg-gray-800 text-white focus:ring-blue-500"}`}
  />
  {error && error.includes("Project name") && (
    <p className="text-red-400 text-sm mt-1">{error}</p>
  )}
</div>

          {/* Prompt */}
          <div className="mt-6">
            <label className="text-gray-300 font-medium mb-2 block">
              Prompt
            </label>
            <textarea
              rows={6}
              maxLength={1000}
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Describe features, users, workflows..."
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>
  {promptsLeft !== null
    ? `${promptsLeft} AI prompts remaining
`
    : "Sign up or Login before Generate"}
</span>

              <span>{charactersCount}/1000</span>
            </div>
          </div>

          {/* Button */}
          {promptsLeft === 0 ? (
  <button
    onClick={() => setShowPlans(true)}
    className="w-full mt-8 py-4 rounded-xl font-semibold
      bg-gradient-to-r from-pink-600 to-red-500 text-white
      hover:shadow-lg hover:shadow-red-500/30"
  >
    Buy More Prompts →
  </button>
) : (
  <button
    disabled={!projectName || !prompt}
    onClick={handleGenerateClick}
    className={`w-full mt-8 py-4 rounded-xl font-semibold transition-all
      ${
        projectName && prompt
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/30"
          : "bg-gray-700 text-gray-400 cursor-not-allowed"
      }`}
  >
    Generate Blueprint →
  </button>
)}
        </div>
      </div>
    </div>
  );
}
