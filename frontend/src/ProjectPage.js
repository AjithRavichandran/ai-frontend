// src / ProjectPage.js
import React, { useEffect, useState } from "react";
import { useAuthStore } from "./authStore";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "./config";

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updated");

  const { accessToken, refreshAccessToken } = useAuthStore();
  const navigate = useNavigate();
  
const [editingId, setEditingId] = useState(null);
const [editedName, setEditedName] = useState("");

const getInitials = (name) => {
  if (!name || name.trim() === "") return "?"; // fallback
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
const deleteProject = async (projectId) => {
  if (!window.confirm("Are you sure you want to delete this project?")) return;

  try {
    let token = accessToken || (await refreshAccessToken());
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `${BACKEND_URL}/api/generate/projects/${projectId}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to delete project");

    // ✅ Remove project from UI immediately
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  } catch (err) {
    console.error("❌ Delete failed:", err);
    alert("Failed to delete project");
  }
};

const updateProjectName = async (projectId) => {
  try {
    let token = accessToken || (await refreshAccessToken());
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `${BACKEND_URL}/api/generate/projects/${projectId}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ project_name: editedName.trim() }),
      }
    );

    if (!res.ok) throw new Error("Failed to update project name");

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, project_name: editedName } : p
      )
    );
  } catch (err) {
    console.error(err);
  } finally {
    setEditingId(null);
  }
};

  useEffect(() => {
  const fetchProjects = async () => {
    try {
      let token = accessToken;

      if (!token) {
        token = await refreshAccessToken();
        if (!token) throw new Error("Please log in first");
      }

      const res = await fetch(`${BACKEND_URL}/api/generate/projects/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) throw new Error("Session expired. Please log in again.");
      if (!res.ok) throw new Error("Failed to fetch projects");

      let data = await res.json();

      // ✅ Sort by last updated descending (latest first)
      data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      setProjects(data);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchProjects();
}, [accessToken, refreshAccessToken]);


  // 2️⃣ Redirect on session expired or missing token
  useEffect(() => {
    if (error === "Session expired. Please log in again." || error === "Please log in first") {
      navigate("/login");
    }
  }, [error, navigate]);
useEffect(() => {
    document.title = "Projects | PCL Infotech";
  }, []);
useEffect(() => {
    let filtered = [...projects].filter((proj) =>
      proj.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === "updated") {
      filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.project_name.localeCompare(b.project_name));
    }

    setFilteredProjects(filtered);
  }, [searchTerm, sortBy, projects]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      {/* Company name header */}
      <h1 className="text-4xl font-bold mb-8 text-blue-400">PROJECTS</h1>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-200 p-3 rounded-lg mb-6 w-full max-w-lg text-center">
          {error}
        </div>
      )}

      {/* Search & Sort */}
<div className="flex flex-col md:flex-row gap-4 w-full max-w-6xl mb-6">
  <input
    type="text"
    placeholder="Search projects..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="flex-1 p-3 rounded-lg border border-blue-500 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
  />

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="p-3 rounded-lg border border-blue-500 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
  >
    <option value="updated">Sort by Last Updated</option>
    <option value="name">Sort by Name</option>
  </select>

  <button
    onClick={() => navigate("/prompt")}
    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-200"
  >
    + Add New Project
  </button>
</div>


      {/* Projects list */}
<div className="w-full max-w-6xl bg-gray-800/60 backdrop-blur rounded-2xl shadow-xl border border-gray-700 p-8">
  <h2 className="text-xl font-semibold mb-4 text-gray-200 border-b border-gray-600 pb-2">
 {filteredProjects.length} - PCL Projects 

  </h2>

  {projects.length === 0 ? (
    <p className="text-gray-400 text-center py-4">
      No projects found. Generate one to get started!
    </p>
  ) : (
  <ul
  className="grid justify-center gap-8"
  style={{
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
  }}
>

  {filteredProjects.map((proj) => (
    <li
  key={proj.id}
  onClick={() =>
  window.open(
    `/editor/${encodeURIComponent(proj.project_name)}`,
    "_blank",
    "noopener,noreferrer"
  )
}

  className="group relative bg-gradient-to-br from-gray-700 to-gray-800 
             rounded-2xl p-6 cursor-pointer shadow-lg 
             hover:shadow-blue-500/20 hover:-translate-y-1 
             transition-all duration-300 border border-gray-600"
>
  {/* Accent bar */}
  <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-blue-500/80" />

  {/* Left-side user initials */}
  <div className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
    {getInitials(proj.user_name)}
  </div>

  {/* Project name with left padding to avoid overlap */}
  <div className="pl-14 mb-2 flex items-center space-x-2">
 {editingId === proj.id ? (
  <input
    autoFocus
    value={editedName}
    onChange={(e) => setEditedName(e.target.value)}
    onBlur={() => updateProjectName(proj.id)}
    onKeyDown={(e) => {
      if (e.key === "Enter") updateProjectName(proj.id);
      if (e.key === "Escape") setEditingId(null);
    }}
    className="flex-1 bg-gray-800 text-white border border-gray-600 
               rounded-xl px-3 py-2 text-lg font-semibold 
               focus:outline-none focus:ring-2 focus:ring-blue-500
               focus:border-transparent transition-all duration-200 placeholder-gray-400"
    placeholder="Enter project name"
    onClick={(e) => e.stopPropagation()} // ✅ stop click from bubbling
  />
) : (
  <>
    <h3 className="flex-1 text-lg font-bold text-white truncate select-none">
  {proj.project_name || "Untitled Project"}
</h3>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // ✅ stop card click
        setEditingId(proj.id);
        setEditedName(proj.project_name);
      }}
      className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
    >
      ✏️
    </button>
  </>
)}

</div>



  {/* Last updated */}
  <p className="text-xs text-gray-400 mt-2 pl-14">
    Last updated: {new Date(proj.updated_at).toLocaleDateString()}
  </p>

  <div className="flex items-center justify-between text-sm text-gray-400 mt-4 pl-14">
    <span className="group-hover:text-blue-400 transition">
      Open Editor →
    </span>

    <span className="text-xs text-grey bg-gray-900 px-2 py-1 rounded-md">
      Project
    </span>
  </div>
</li>
  ))}
</ul>


  )}
</div>

    </div>
  );
}
