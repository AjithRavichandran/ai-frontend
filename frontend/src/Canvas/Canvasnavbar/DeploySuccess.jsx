// src/Canvas/Canvasnavbar/DeploySuccess.jsx
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { CheckCircle, ExternalLink, Edit, Copy } from "lucide-react";

export default function DeploySuccess() {
  const { projectSlug, pageSlug } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const projectName = state?.projectName || "Your Project";
const liveUrl =
  process.env.NODE_ENV === "development"
    ? `http://localhost:3000/${projectSlug}/${pageSlug}`
    : `https://${projectSlug}.${process.env.REACT_APP_LIVE_DOMAIN}/${pageSlug || ""}`;


  const copyUrl = async () => {
    await navigator.clipboard.writeText(liveUrl);
  };
useEffect(() => {
  const duration = 2000; // 2 seconds
  const animationEnd = Date.now() + duration;

  const colors = ['#22c55e', '#3b82f6', '#facc15', '#f87171', '#a855f7'];

  const blast = () => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;

    // Spawn 1 particle per color for a multi-color subtle effect
    colors.forEach(color => {
      confetti({
        particleCount: 1,
        angle: Math.random() * 60 + 60, // 60–120 degrees
        spread: 60,
        origin: { x: Math.random(), y: 1 },
        colors: [color],
        gravity: 0.6,
        scalar: 1,
        drift: (Math.random() - 0.5) * 0.2,
      });
    });

    requestAnimationFrame(blast);
  };

  blast();
}, []);



  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8">

        {/* ✅ Success Icon */}
        <div className="flex justify-center mb-4">
          <CheckCircle className="text-green-400" size={64} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2">
          🎉 Congrats! {projectName} is live
        </h1>

        <p className="text-center text-gray-400 mb-6">
          Your project is now visible to everyone.
        </p>

        {/* 🌍 Live Preview Card */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Live URL</span>
            <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-gray-900 px-3 py-2 rounded-lg">
            <span className="text-sm truncate">{liveUrl}</span>
            <button
              onClick={copyUrl}
              className="text-gray-400 hover:text-white"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* 🚀 Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-green-600 hover:bg-green-700 transition rounded-lg py-3 flex items-center justify-center gap-2 font-semibold"
          >
            Visit Live Site <ExternalLink size={16} />
          </a>

          <button
            onClick={() => navigate(`/editor/${projectSlug}`)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 transition rounded-lg py-3 flex items-center justify-center gap-2 font-semibold"
          >
            Back to Editor <Edit size={16} />
          </button>
        </div>

        {/* Reassurance */}
        <p className="text-sm md:text-base text-gray-300 text-center mt-6 font-medium">
  Thanks for choosing PCL — we’re excited to see what you build.
</p>



      </div>
    </div>
  );
}
