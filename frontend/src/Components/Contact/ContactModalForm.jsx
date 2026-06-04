// src/App.jsx
import { useState } from 'react';
import { Rnd } from 'react-rnd';
import './App.css';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('desktop');

  const handleGenerate = async () => {
    const res = await fetch("http://localhost:5000/generate", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.html, "text/html");
    const newBlocks = Array.from(doc.body.children).map((el, idx) => ({
      id: idx,
      html: el.outerHTML,
      text: el.textContent,
      style: { fontSize: '16px', color: '#000000', backgroundColor: '#ffffff' },
      x: 50 + idx * 20,
      y: 50 + idx * 20,
      width: 300,
      height: 150
    }));
    setBlocks(newBlocks);
  };

  const handleExport = () => {
    const html = blocks.map(b => b.html).join('\n');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_page.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateBlockStyle = (property, value) => {
    const updated = blocks.map(b =>
      b.id === selectedId ? { ...b, style: { ...b.style, [property]: value } } : b
    );
    setBlocks(updated);
  };

  const setResponsiveView = (mode) => setViewMode(mode);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
        <div className="flex space-x-2 w-2/3">
          <input
            className="flex-1 p-2 text-white rounded"
            placeholder="Enter prompt for AI"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button onClick={handleGenerate} className="bg-blue-500 px-4 py-2 rounded">Generate</button>
          <button onClick={handleExport} className="bg-green-500 px-4 py-2 rounded">Export</button>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setResponsiveView('desktop')}>🖥</button>
          <button onClick={() => setResponsiveView('tablet')}>📱</button>
          <button onClick={() => setResponsiveView('mobile')}>📞</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-1/6 bg-white border-r p-4">
          <h2 className="font-bold mb-4">Components</h2>
          <ul className="space-y-2 text-sm">
            <li>Header</li>
            <li>Image</li>
            <li>Text</li>
            <li>Button</li>
            <li>Paragraph</li>
          </ul>
        </div>

        {/* Canvas Center */}
        <div className={flex-1 bg-gray-100 relative p-4 overflow-auto ${viewMode === 'tablet' ? 'w-[768px]' : viewMode === 'mobile' ? 'w-[375px]' : 'w-full'}}>
          {blocks.map((block, idx) => (
            <Rnd
              key={block.id}
              size={{ width: block.width, height: block.height }}
              position={{ x: block.x, y: block.y }}
              onDragStop={(e, d) => {
                const updated = [...blocks];
                updated[idx].x = d.x;
                updated[idx].y = d.y;
                setBlocks(updated);
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const updated = [...blocks];
                updated[idx].width = ref.offsetWidth;
                updated[idx].height = ref.offsetHeight;
                updated[idx].x = position.x;
                updated[idx].y = position.y;
                setBlocks(updated);
              }}
              onClick={() => setSelectedId(block.id)}
              className={border ${selectedId === block.id ? 'border-blue-500' : 'border-transparent'}}
            >
              <div
                style={block.style}
                className="h-full w-full overflow-auto p-2"
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            </Rnd>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="w-1/6 bg-white border-l p-4">
          <h2 className="font-bold mb-4">Edit Appearance</h2>
          {selectedId !== null && (
            <>
              <label className="block">Font Size</label>
              <input type="number" className="mb-2 w-full border p-1" onChange={(e) => updateBlockStyle('fontSize', ${e.target.value}px)} />

              <label className="block">Text Color</label>
              <input type="color" className="mb-2 w-full border p-1" onChange={(e) => updateBlockStyle('color', e.target.value)} />

              <label className="block">Background Color</label>
              <input type="color" className="mb-2 w-full border p-1" onChange={(e) => updateBlockStyle('backgroundColor', e.target.value)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// // components/ContactModelForm.js
// import React, { useState } from "react";
// import PhoneInput from "react-phone-number-input";

// const ContactModelForm = ({ isOpen, onClose }) => {
//   const [formData, setFormData] = useState({
//     fname: "",
//     lname: "",
//     email: "",
//     mobile: "",
//     message: "",
//   });

//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setStatus("");
//     setError("");

//     try {
//       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/pclinfo`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(formData),
//         }
//       );

//       const result = await response.json();

//       if (response.ok) {
//         setStatus("Message sent successfully!");
//         setFormData({
//           fname: "",
//           lname: "",
//           email: "",
//           mobile: "",
//           message: "",
//         });

//         // Delay a bit before closing modal and refreshing
//         setTimeout(() => {
//           onClose(); // ✅ close modal
//           window.location.reload(); // ✅ refresh page
//         }, 1500);
//       } else {
//         setError(result?.message || "Submission failed.");
//       }
//     } catch (error) {
//       setError("An unexpected error occurred. Please try again.");
//       console.error(error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="fixed inset-0 bg-black bg-opacity-50"
//         onClick={onClose}
//       ></div>

//       <div className="flex items-center justify-center min-h-screen p-4">
//         <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative">
//           <div className="flex items-center justify-between p-6 border-b border-gray-200">
//             <h3 className="text-xl font-semibold">Contact Us</h3>
//             <button
//               onClick={onClose}
//               className="text-gray-400 text-xl font-semibold hover:text-red-500"
//             >
//               ✕
//             </button>
//           </div>

//           <div className="p-6">
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Form Fields */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm text-left block">First Name</label>
//                   <input
//                     name="fname"
//                     value={formData.fname}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-sm text-left block">Last Name</label>
//                   <input
//                     name="lname"
//                     value={formData.lname}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm text-left block">Email</label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="text-sm text-left block mb-1">
//                     Phone Number
//                   </label>
//                   <PhoneInput
//                     name="mobile"
//                     defaultCountry="IN"
//                     value={formData.mobile}
//                     onChange={(value) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         mobile: value,
//                       }))
//                     }
//                     className="w-full phone-input"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="text-sm text-left block">Message</label>
//                 <textarea
//                   name="message"
//                   value={formData.message}
//                   onChange={handleChange}
//                   required
//                   rows="4"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 ></textarea>
//               </div>

//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full bg-[#004aad] text-white py-2 rounded hover:bg-blue-700 transition"
//               >
//                 {isSubmitting ? "Sending..." : "Send Message"}
//               </button>
//             </form>

//             {/* Status / Error Messages */}
//             {status && (
//               <div className="mt-4 text-green-600 text-center">{status}</div>
//             )}
//             {error && (
//               <div className="mt-4 text-red-600 text-center">{error}</div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ContactModelForm;
