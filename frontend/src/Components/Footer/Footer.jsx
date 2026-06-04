import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../../PCL1.png";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-gray-950 to-black text-gray-300">
      {/* subtle top glow */}
      <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-transparent blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* BRAND */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2">
              <img src={Logo} alt="PCL Infotech Logo" className="h-10 w-auto" />
            </div>

            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-sm">
              PCL Infotech is a technology-driven IT solutions company delivering
              scalable web, mobile, and digital products for modern businesses.
            </p>

            {/* Social */}
            <div className="flex items-center gap-5 mt-6">
              {[faFacebook, faInstagram, faTwitter].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition"
                >
                  <FontAwesomeIcon icon={icon} />
                </a>
              ))}
            </div>
          </div>

          {/* LINKS */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="/contact-info" className="hover:text-white">Contact</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms-and-conditions" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/web-development" className="hover:text-white">Web Development</Link></li>
                <li><Link to="/mobile-app-development" className="hover:text-white">Mobile Apps</Link></li>
                <li><Link to="/web-design" className="hover:text-white">UI / UX Design</Link></li>
                <li><Link to="/digital-marketing" className="hover:text-white">Digital Marketing</Link></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-white font-semibold mb-4">Solutions</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/software-products" className="hover:text-white">Software Products</Link></li>
                <li><Link to="/domain-registration" className="hover:text-white">Domain Services</Link></li>
                <li><Link to="/vps-hosting" className="hover:text-white">VPS Hosting</Link></li>
                <li><Link to="/communication" className="hover:text-white">Communication</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <FontAwesomeIcon icon={faEnvelope} className="mt-1 text-gray-400" />
                  info@pclinfotech.com
                </li>
                <li className="flex gap-3">
                  <FontAwesomeIcon icon={faPhone} className="mt-1 text-gray-400" />
                  +91 72000 74253
                </li>
                <li className="flex gap-3">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-1 text-gray-400" />
                  <span>
                    No.2/156, 1st Floor, Poonamallee–Avadi Road,
                    Senneerkuppam, Chennai – 600056
                  </span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-14 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PCL Infotech. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;