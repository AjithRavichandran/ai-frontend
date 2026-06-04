import {
  LayoutTemplate,
  Sparkles,
  Users,
  Rocket,
  MonitorPlay,
  Database,
  Workflow
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../authStore";
import { useEffect, useState } from "react";
import aboutpage3 from "./Assets/homeimage/TheAIExpectation.jfif";
import aboutpage5 from "./Assets/homeimage/cuartan.jfif";
import aboutpage6 from "./Assets/homeimage/HeroSection2.jpg.jpeg";
import aboutpage7 from "./Assets/homeimage/Screenshot4.png";
import aboutpage8 from "./Assets/homeimage/Screenshot5.png";
import aboutpage9 from "./Assets/homeimage/Screenshot6.png";
import aboutpage10 from "./Assets/homeimage/Resize1.png";


export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartBuilding = () => {
    navigate("/prompt");
  };

const showcaseSlides = [
  {
    image: aboutpage9,
    title: "Design Visually",
    subtitle: "On the Canvas page, you can build your app exactly the way you imagine — drag and drop elements, arrange layouts, customize styles, and see changes in real time. Every page, component, and interaction is fully editable, letting you create responsive, production-ready interfaces without writing a single line of code."
  },
  {
    image: aboutpage7,
    title: "Define Workflows",
    subtitle: "On the Workflow canvas, you can control your app’s behavior without code. Create actions, triggers, and conditions using a visual flow editor, connect different screens, and define dynamic interactions — all in a clear, drag-and-drop interface that shows exactly how your app responds to user actions."
  },
  {
    image: aboutpage8,
    title: "Manage Data & App State",
    subtitle: "The DataTypes or AppData section lets you define, organize, and connect your app’s data. Create tables, fields, and relationships visually, manage app state, and link data directly to UI components — ensuring your app is fully dynamic and ready to handle real-world interactions without writing backend code."
  }
];
const [activeSlide, setActiveSlide] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setActiveSlide((prev) => (prev + 1) % showcaseSlides.length);
  }, 4000);

  return () => clearInterval(timer);
}, []);
const cards = [
  { title: "SaaS Applications", icon: LayoutTemplate, color: "blue-500" },
  { title: "Admin Panels & Dashboards", icon: Database, color: "purple-500" },
  { title: "Marketplaces", icon: Users, color: "pink-500" },
  { title: "Internal Tools", icon: Workflow, color: "green-500" },
  { title: "AI-Powered Apps", icon: Sparkles, color: "indigo-500" },
  { title: "Startup MVPs", icon: Rocket, color: "orange-500" },
];
const colorMap = {
  "blue-500": "border-blue-500 text-blue-500",
  "purple-500": "border-purple-500 text-purple-500",
  "pink-500": "border-pink-500 text-pink-500",
  "green-500": "border-green-500 text-green-500",
  "indigo-500": "border-indigo-500 text-indigo-500",
  "orange-500": "border-orange-500 text-orange-500",
};
const [activeIndex, setActiveIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
}, 2000); // was 3000

  return () => clearInterval(interval);
}, []);

  return (
  <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white to-blue-100 text-gray-900">

    {/* GRID BACKGROUND */}
    <div className="pointer-events-none absolute inset-0 
      bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),
          linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] 
      bg-[size:48px_48px] opacity-10"
    />

<div className="relative w-screen aspect-[16/9] max-h-screen overflow-hidden">
  <img
    src={aboutpage6}
    alt="AI No-Code Platform Hero"
    className="absolute inset-0 w-full h-full object-cover"
  />

  <div className="absolute inset-0 z-10 flex items-end justify-center
                pb-6 sm:pb-10 lg:pb-24">
  <button
    onClick={handleStartBuilding}
    className="px-10 py-4 rounded-full
               bg-gradient-to-r from-blue-600 to-purple-600
               text-white font-semibold
               hover:scale-105 hover:shadow-2xl transition"
  >
    Start Building
  </button>
</div>
</div>

    {/* ✅ PAGE CONTENT — INSIDE CONTAINER */}
    <div className="relative z-10 container mx-auto px-6 pb-20">
   </div>
{/* SLIDING SHOWCASE SECTION */}
<div className="relative w-full py-24">

  <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] items-center">

    {/* TEXT – LEFT */}
    <div className="max-w-xl px-6 lg:px-24">
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        {showcaseSlides[activeSlide].title}
      </h2>
      <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
        {showcaseSlides[activeSlide].subtitle}
      </p>
    </div>
{/* IMAGE – RIGHT (FULL WIDTH FEEL) */}
<div className="relative w-full aspect-[1898/843] bg-white lg:ml-4 scale-[0.9] origin-top-left">
  {showcaseSlides.map((slide, index) => (
    <img
      key={index}
      src={slide.image}
      alt={slide.title}
      className={`absolute inset-0 w-full h-full object-contain scale-[0.96] transition-all duration-1000
        ${index === activeSlide ? "opacity-100" : "opacity-0"}`}
    />
  ))}
</div>
  </div>

  {/* DOT INDICATORS */}
  <div className="mt-12 flex justify-center gap-3">
    {showcaseSlides.map((_, i) => (
      <span
        key={i}
        className={`h-2.5 w-2.5 rounded-full transition-all
          ${i === activeSlide ? "bg-blue-600 scale-125" : "bg-gray-300"}`}
      />
    ))}
  </div>

</div>
 {/* SECTION DIVIDER */}
        <div className="my-32 flex justify-center">
          <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
        </div>

        {/* ABOUT */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32 mt-12 lg:mt-20">

          {/* IMAGE */}
          <div className="flex justify-center">
            <img
              src={aboutpage3}
              alt="No-Code App Builder"
              className="max-w-[460px] w-full object-contain rounded-2xl shadow-xl"
            />
          </div>

          {/* TEXT */}
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold mb-10 text-gray-900">
              What Makes Us <span className="text-blue-600">Different</span>
            </h2>

            <div className="space-y-8 max-w-xl mx-auto">

              {/* Feature 1 */}
              <div className="flex gap-5">
                <Sparkles className="w-7 h-7 text-blue-600 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-blue-600 mb-1">
                    AI-Driven App Creation
                  </h4>
                  <p className="text-base text-gray-900 leading-relaxed">
                    Describe what you want to build and let AI generate layouts,
                    workflows, and logic instantly.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-5">
                <Workflow className="w-7 h-7 text-purple-600 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-purple-600 mb-1">
                    True Visual Logic
                  </h4>
                  <p className="text-base text-gray-900 leading-relaxed">
                    Every action, condition, and flow is visible and editable —
                    no hidden rules or magic states.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-5">
                <MonitorPlay className="w-7 h-7 text-pink-600 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-pink-600 mb-1">
                    Production-Ready by Default
                  </h4>
                  <p className="text-base text-gray-900 leading-relaxed">
                    Apps are optimized, scalable, and secure from day one —
                    not just demos or prototypes.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-5">
                <Rocket className="w-7 h-7 text-green-600 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-green-600 mb-1">
                    Launch in Minutes
                  </h4>
                  <p className="text-base text-gray-900 leading-relaxed">
                    Go from idea to live app with one click — no hosting, builds, or deployments to manage.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>


 {/* SECTION DIVIDER */}
        <div className="my-32 flex justify-center">
          <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
        </div>

{/* WHAT CAN YOU BUILD - Border Color Cards */}
<div className="mb-32 max-w-6xl mx-auto">
  <h2 className="text-4xl font-bold text-center mb-8 text-gray-900">
    What Can You {" "}
    <span className="text-blue-600">Build With This?</span>
  </h2>

  <p className="text-center text-gray-900 max-w-2xl mx-auto mb-16 text-lg">
    From simple tools to full-scale products — build real, production-ready
    applications without writing code.
  </p>

 <div className="relative flex justify-center items-center h-[420px] overflow-hidden">
  <div
    className="flex items-center gap-10"
    style={{
      transform: `translateX(calc(50% - ${(activeIndex + 0.5) * 360}px))`,
      transition: "transform 700ms ease-in-out",
    }}
  >
    {cards.map((card, index) => {
      const Icon = card.icon;
      const isActive = index === activeIndex;

      return (
        <div
          key={index}
          className={`
            w-[320px] p-10 rounded-2xl shadow-xl text-center border-4
            transition-all duration-700
            ${colorMap[card.color]}
            ${
              isActive
                ? "scale-110 opacity-100 z-10"
                : "scale-90 opacity-40"
            }
          `}
        >
          <Icon className="w-14 h-14 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-3 text-gray-900">
            {card.title}
          </h3>
          <p className="text-base text-gray-700 leading-relaxed">
            Build production-ready applications visually without writing code.
          </p>
        </div>
      );
    })}
  </div>
</div>
</div>


    {/* SECTION DIVIDER */}
        <div className="my-32 flex justify-center">
          <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
        </div>
    
        {/* WHO NEEDS THIS */}
        <div className="mb-32 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
<h2 className="text-4xl font-bold text-center mb-8 text-gray-900">
  <span className="text-blue-600">Who Needs</span> This?  
</h2>
            <div className="space-y-8">
              <div className="flex gap-5">
                <Users className="w-8 h-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900">You have an idea</h3>
                  <p className="text-base text-gray-900 leading-relaxed">
                    Founders who want to move fast without waiting on dev resources.
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <LayoutTemplate className="w-8 h-8 text-purple-600 mt-1" />
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900">You design products</h3>
                  <p className="text-base text-gray-900 leading-relaxed">
                    Designers and PMs who want designs to actually become real apps.
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <Database className="w-8 h-8 text-pink-600 mt-1" />
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900">You don’t code</h3>
                  <p className="text-base text-gray-900 leading-relaxed">
                    Builders who want power without complexity or syntax.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* IMAGE */}
          <div className="flex justify-center w-full mt-8">
            <div className="w-full max-w-[900px] aspect-[16/9] overflow-hidden rounded-2xl shadow-xl">
              <img
                src={aboutpage5}
                alt="Who this platform is for"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>


 {/* SECTION DIVIDER */}
        <div className="my-32 flex justify-center">
          <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
        </div>


 {/* HOW IT WORKS */}
<div className="mb-32 px-4 md:px-0">
  <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
    How it <span className="text-blue-600">Works</span>
  </h2>

  <div className="flex flex-col md:flex-row items-center justify-center gap-8">

    {/* Step 1 */}
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl hover:scale-105 transition-transform duration-300 w-full md:w-1/3">
      <LayoutTemplate className="w-16 h-16 mb-4 text-blue-600" />
      <h3 className="text-2xl font-semibold mb-2 text-blue-800">Design Visually</h3>
      <p className="text-gray-700 text-sm">
        Build pages with drag-and-drop elements, layouts, and styles exactly how you want.
      </p>
    </div>

    {/* Step 2 */}
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl hover:scale-105 transition-transform duration-300 w-full md:w-1/3">
      <Workflow className="w-16 h-16 mb-4 text-purple-600" />
      <h3 className="text-2xl font-semibold mb-2 text-purple-800">Define Logic & Workflows</h3>
      <p className="text-gray-700 text-sm">
        Control user actions, conditions, navigation, and app behavior using visual workflows.
      </p>
    </div>

    {/* Step 3 */}
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl hover:scale-105 transition-transform duration-300 w-full md:w-1/3">
      <Rocket className="w-16 h-16 mb-4 text-pink-600" />
      <h3 className="text-2xl font-semibold mb-2 text-pink-800">Preview & Launch</h3>
      <p className="text-gray-700 text-sm">
        Preview your app instantly, test interactions, then deploy live with a single click.
      </p>
    </div>

  </div>
</div>
        {/* FINAL CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-16 shadow-2xl">
          <h2 className="text-4xl font-bold mb-6">
            Build Your App Without Code
          </h2>
          <p className="mb-8 text-white/90">
            Design, connect data, define logic, and launch — all visually.
          </p>
          <button
            onClick={handleStartBuilding}
            className="px-10 py-4 bg-white text-gray-900 font-semibold rounded-full hover:scale-105 transition"
          >
            Get Started Free
          </button>
        </div>

      </div>
  );
}