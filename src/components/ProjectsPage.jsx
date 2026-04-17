// components/ProjectsPage.jsx
import { useEffect, useState } from "react";
import { FaPlus, FaSearch, FaTrash, FaEdit, FaCode, FaEllipsisV } from "react-icons/fa";
import { getUserProjects, createProject, updateProjectName, deleteProject, listenUserProjects } from "../utils/projectsService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const languageInfo = {
  waskart: { name: "Waskart", icon: "⚡", color: "from-blue-500 to-blue-600" },
  bloques: { name: "Quí-roz", icon: "🧩", color: "from-purple-500 to-purple-600" }
};

export default function ProjectsPage({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("waskart");
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [showMenu, setShowMenu] = useState(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
  if (!currentUser) {
    console.log("⚠️ [ProjectsPage] No hay currentUser");
    setLoading(false);
    return;
  }
  
  const loadProjects = async () => {
    setLoading(true);
    console.log("🔄 [ProjectsPage] Cargando proyectos para:", currentUser.uid);
    try {
      const projectsList = await getUserProjects(currentUser.uid);
      console.log("📦 [ProjectsPage] Proyectos recibidos:", projectsList.length);
      setProjects(projectsList);
    } catch (error) {
      console.error("❌ [ProjectsPage] Error cargando proyectos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  loadProjects();
}, [currentUser]);

  const handleCreateProject = async () => {
    setCreating(true);
    try {
      console.log("🚀 [ProjectsPage] Creando proyecto con lenguaje:", selectedLanguage);
      const newProject = await createProject(currentUser.uid, selectedLanguage);
      console.log("✅ [ProjectsPage] Proyecto creado:", newProject);
      setProjects([newProject, ...projects]);
      setShowLanguageModal(false);
      setSelectedLanguage("waskart");
    } catch (error) {
      console.error("❌ [ProjectsPage] Error creating project:", error);
      alert("Error al crear el proyecto: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRenameProject = async () => {
    if (!editingProject || !newProjectName.trim()) return;
    try {
      await updateProjectName(editingProject.id, newProjectName);
      setProjects(projects.map(p => 
        p.id === editingProject.id ? { ...p, name: newProjectName } : p
      ));
      setEditingProject(null);
      setNewProjectName("");
      setShowMenu(null);
    } catch (error) {
      console.error("Error renaming project:", error);
      alert("Error al renombrar el proyecto");
    }
  };

  const handleDeleteProject = async (project) => {
    if (!confirm(`¿Eliminar el proyecto "${project.name}"?`)) return;
    try {
      await deleteProject(project.id, currentUser.uid);
      setProjects(projects.filter(p => p.id !== project.id));
      setShowMenu(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error al eliminar el proyecto");
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return "Fecha desconocida";
    return formatDistanceToNow(timestamp, { addSuffix: true, locale: es });
  };

  const handleAdmin = () => {
    const inpValue = document.getElementById("inp1").value;
    if (inpValue === "0310") {
      setIsAdmin(true)
    } else{
      setIsAdmin(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Cargando proyectos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {isAdmin ? (
        ""
      ) : (
        <div className="absolute top-0 left-0 w-full h-full bg-[#000000]/70 flex items-center justify-center z-50">
          <div className="w-[80%] h-auto py-3 px-4 bg-white">
            <p className="text-center font-medium text-xl">We are working on it please wait or if you are admin enter the pass code</p>
            <input type="text" name="" placeholder="Passcode" id="inp1" />
            <button type="button" onClick={handleAdmin}>Ingresar</button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Mis Proyectos</h1>
              <p className="text-gray-400 text-sm mt-1">
                {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
              </p>
            </div>
            
            <button
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition"
            >
              <FaPlus className="text-sm" />
              Nuevo proyecto
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#161B22] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#238636]"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-400 text-lg">No hay proyectos</p>
            <p className="text-gray-500 text-sm mt-2">Crea tu primer proyecto haciendo clic en "Nuevo proyecto"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => {
              const lang = languageInfo[project.language] || languageInfo.waskart;
              
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition"
                >
                  {/* Card Preview */}
                  <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${lang.color} flex items-center justify-center`}>
                        <span className="text-3xl">{lang.icon}</span>
                      </div>
                    </div>
                    {/* Language badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300`}>
                        {lang.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                      
                      {/* Menu button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === project.id ? null : project.id)}
                          className="p-1 text-gray-500 hover:text-white rounded-md transition"
                        >
                          <FaEllipsisV className="text-sm" />
                        </button>
                        
                        {showMenu === project.id && (
                          <div className="absolute right-0 mt-2 w-36 bg-[#21262D] border border-gray-700 rounded-md shadow-lg z-10">
                            <button
                              onClick={() => {
                                setEditingProject(project);
                                setNewProjectName(project.name);
                                setShowMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition"
                            >
                              <FaEdit className="text-xs" />
                              Renombrar
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-gray-700 transition"
                            >
                              <FaTrash className="text-xs" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaCode className="text-[10px]" />
                        {project.pages?.length || 1} páginas
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de lenguaje */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#161B22] rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Crear nuevo proyecto</h2>
              <p className="text-gray-400 text-sm mb-6">Selecciona el lenguaje de programación</p>
              
              <div className="space-y-3">
                {/* Waskart */}
                <div
                  onClick={() => setSelectedLanguage("waskart")}
                  className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition border-2 ${
                    selectedLanguage === "waskart"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Waskart</h3>
                    <p className="text-gray-400 text-sm">Programación tradicional con sintaxis limpia</p>
                  </div>
                  {selectedLanguage === "waskart" && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Quí-roz */}
                <div
                  onClick={() => setSelectedLanguage("bloques")}
                  className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition border-2 ${
                    selectedLanguage === "bloques"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl">🧩</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Quí-roz</h3>
                    <p className="text-gray-400 text-sm">Programación visual por bloques</p>
                  </div>
                  {selectedLanguage === "bloques" && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#238636] text-white rounded-md hover:bg-[#2ea043] transition disabled:opacity-50"
                >
                  {creating ? "Creando..." : "Crear proyecto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de renombrar */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#161B22] rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Renombrar proyecto</h2>
              <p className="text-gray-400 text-sm mb-4">Ingresa un nuevo nombre</p>
              
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D1117] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#238636]"
                autoFocus
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setNewProjectName("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRenameProject}
                  className="flex-1 px-4 py-2 bg-[#238636] text-white rounded-md hover:bg-[#2ea043] transition"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}