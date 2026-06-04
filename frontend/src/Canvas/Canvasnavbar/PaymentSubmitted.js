import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { CheckCircle } from "lucide-react";

const PaymentSubmitted = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const message =
    location.state?.message || "Our team will email you once the payment is verified!";
  const projectSlug = location.state?.projectSlug || null;

  // Confetti effect on page load
  useEffect(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const colors = ["#22c55e", "#3b82f6", "#facc15", "#f87171", "#a855f7"];

    const blast = () => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return;

      colors.forEach((color) => {
        confetti({
          particleCount: 1,
          angle: Math.random() * 60 + 60,
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

  const liveUrl = projectSlug
    ? process.env.NODE_ENV === "development"
      ? `http://localhost:3000/${projectSlug}`
      : `https://${projectSlug}.${process.env.REACT_APP_LIVE_DOMAIN}`
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8">

        {/* ✅ Success Icon */}
        <div className="flex justify-center mb-4">
          <CheckCircle className="text-green-400" size={64} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2">🎉 Payment Submitted!</h1>

        {/* Message */}
        <p className="text-center text-gray-400 mb-6">{message}</p>

        {/* Optional Project URL */}
        {liveUrl && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Project URL</span>
              <span className="text-xs bg-yellow-500 px-2 py-0.5 rounded-full">PENDING</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-gray-900 px-3 py-2 rounded-lg">
              <span className="text-sm truncate">{liveUrl}</span>
              <button
                onClick={() => navigator.clipboard.writeText(liveUrl)}
                className="text-gray-400 hover:text-white"
              >
                Copy
              </button>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline text-sm"
              >
                Visit
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 bg-gray-700 hover:bg-gray-600 transition rounded-lg py-3 flex items-center justify-center gap-2 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Reassurance */}
        <p className="text-sm md:text-base text-gray-300 text-center mt-6 font-medium">
          Thanks for choosing PCL — we’re excited to see what you build.
        </p>
      </div>
    </div>
  );
};

export default PaymentSubmitted;