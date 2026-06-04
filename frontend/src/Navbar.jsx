// src/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "./authStore";
import Logo from "./PCL1.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, logout } = useAuthStore();

  const isLoggedIn = !!accessToken;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        onClick={() => setIsOpen(false)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition
          ${
            isActive
              ? "bg-blue-500/10 text-blue-600"
              : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
          }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-gray-200">
      <div className="w-full px-6">

        {/* HEADER */}
        <div className="flex items-center justify-between h-16">

          {/* BRAND */}
          <div className="flex items-center gap-2">
            <img src={Logo} alt="AI Generate Logo" className="h-10 w-auto" />
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn && <NavLink to="/projects">Projects</NavLink>}
            {isLoggedIn && <NavLink to="/prompt">Prompt</NavLink>}

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="ml-3 px-4 py-2 rounded-lg text-sm font-medium
                           text-red-600 border border-red-500/40
                           hover:bg-red-50 transition"
              >
                Logout
              </button>
            ) : (
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() =>
                    navigate("/login", {
                      state: { from: location.pathname },
                    })
                  }
                  className="px-5 py-2 rounded-lg text-sm font-semibold
                             bg-gradient-to-r from-blue-500 to-purple-500
                             text-white hover:opacity-90 transition"
                >
                  Login
                </button>

                <button
  onClick={() => navigate("/signup")}
className="px-5 py-2 rounded-lg text-sm font-semibold
           bg-gradient-to-r from-indigo-500 to-cyan-500
           text-white hover:opacity-90 transition"

>
  Signup
</button>

              </div>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="lg:hidden px-4 pb-4">
          <div className="mt-2 rounded-2xl bg-white shadow-lg border p-4 space-y-2">

            {isLoggedIn && <NavLink to="/projects">Projects</NavLink>}
            {isLoggedIn && <NavLink to="/prompt">Prompt</NavLink>}

            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full mt-2 px-4 py-2 rounded-lg text-sm font-medium
                           text-red-600 border border-red-500/40
                           hover:bg-red-50 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate("/login", {
                      state: { from: location.pathname },
                    });
                    setIsOpen(false);
                  }}
                  className="w-full mt-2 px-4 py-2 rounded-lg text-sm font-semibold
                             bg-gradient-to-r from-blue-500 to-purple-500
                             text-white transition"
                >
                  Login
                </button>

                <button
  onClick={() => {
    navigate("/signup");
    setIsOpen(false);
  }}
className="w-full px-4 py-2 rounded-lg text-sm font-semibold
           bg-gradient-to-r from-indigo-500 to-cyan-500
           text-white hover:opacity-90 transition"

>
  Signup
</button>

              </>
            )}

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
