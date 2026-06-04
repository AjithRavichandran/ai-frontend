// src/Canvas/Canvasnavbar/ProjectUpdated.jsx
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { CheckCircle, ExternalLink, Edit, Copy } from "lucide-react";

export default function ProjectUpdated() {
  const { projectSlug, pageSlug } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const projectName = state?.projectName || "Your Project";
const liveUrl =
  process.env.NODE_ENV === "development"
    ? `http://localhost:3000/${projectSlug}/${pageSlug}`
    : `https://${projectSlug}.${process.env.REACT_APP_LIVE_DOMAIN}/${pageSlug}`;

  // Copy link to clipboard
  const copyUrl = async () => {
    await navigator.clipboard.writeText(liveUrl);
  };

  // Confetti from bottom
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const animationEnd = Date.now() + duration;

    const colors = ['#22c55e', '#3b82f6', '#facc15', '#f87171', '#a855f7'];

    const blast = () => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return;

      // Left side blast
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 100,
        origin: { x: Math.random() * 0.5, y: 1 },
        colors,
        gravity: 0.6,
        scalar: 1,
        drift: 0.1,
      });

      // Right side blast
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 100,
        origin: { x: 0.5 + Math.random() * 0.5, y: 1 },
        colors,
        gravity: 0.6,
        scalar: 1,
        drift: -0.1,
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
          <CheckCircle className="text-blue-400" size={64} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2">
          🔄 {projectName} Updated Successfully!
        </h1>

        <p className="text-center text-gray-400 mb-6">
          Your changes are now live.
        </p>

        {/* 🌍 Live Preview Card */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Live URL</span>
            <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">
              UPDATED
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-gray-900 px-3 py-2 rounded-lg">
            <span className="text-sm truncate">{liveUrl}</span>
            <button onClick={copyUrl} className="text-gray-400 hover:text-white">
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 transition rounded-lg py-3 flex items-center justify-center gap-2 font-semibold"
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

      </div>
    </div>
  );
}
