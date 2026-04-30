// components/ProjectsPage.jsx
import { useEffect, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaTrash,
  FaEdit,
  FaCode,
  FaEllipsisV,
} from "react-icons/fa";
import {
  getUserProjects,
  createProject,
  updateProjectName,
  deleteProject,
  listenUserProjects,
} from "../utils/projectsService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const languageInfo = {
  waskart: { name: "Waskart", icon: "⚡", color: "from-blue-500 to-blue-600" },
  bloques: {
    name: "Quí-roz",
    icon: "🧩",
    color: "from-purple-500 to-purple-600",
  },
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
      console.log(
        "🔄 [ProjectsPage] Cargando proyectos para:",
        currentUser.uid,
      );
      try {
        const projectsList = await getUserProjects(currentUser.uid);
        console.log(
          "📦 [ProjectsPage] Proyectos recibidos:",
          projectsList.length,
        );
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
      console.log(
        "🚀 [ProjectsPage] Creando proyecto con lenguaje:",
        selectedLanguage,
      );
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
      setProjects(
        projects.map((p) =>
          p.id === editingProject.id ? { ...p, name: newProjectName } : p,
        ),
      );
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
      setProjects(projects.filter((p) => p.id !== project.id));
      setShowMenu(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error al eliminar el proyecto");
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return "Fecha desconocida";
    return formatDistanceToNow(timestamp, { addSuffix: true, locale: es });
  };

  const handleAdmin = () => {
    const inpValue = document.getElementById("inp1").value;
    if (inpValue === "0310") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Cargando proyectos...</div>
      </div>
    );
  }

  return (
    <div className="max-h-full overflow-auto bg-gradient-to-br from-[#0a0a0f] via-[#0f1117] to-[#13151f]">
      {isAdmin ? (
        ""
      ) : (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fadeIn">
          <div className="w-[90%] max-w-md p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl transform animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Acceso Restringido
              </h2>
              <p className="text-gray-400 text-sm">
                Este espacio está en desarrollo. Si eres administrador, ingresa
                el código de acceso.
              </p>
            </div>
            <input
              type="password"
              placeholder="Código de acceso"
              id="inp1"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all mb-4"
            />
            <button
              type="button"
              onClick={handleAdmin}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Ingresar al Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Header Moderno */}
      <div className="relative overflow-hidden">
        {/* Background gradient decorativo */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/5 to-blue-500/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Mis Proyectos
                  </h1>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {projects.length}{" "}
                    {projects.length === 1
                      ? "proyecto activo"
                      : "proyectos activos"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLanguageModal(true)}
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg
                  className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nuevo Proyecto
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar Mejorada */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="relative group">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors duration-300 text-sm" />
          <input
            type="text"
            placeholder="Buscar proyectos por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid Mejorado */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl absolute inset-0"></div>
              <div className="relative text-8xl mb-6 animate-float">📁</div>
            </div>
            <p className="text-gray-400 text-xl font-semibold mb-2">
              No hay proyectos aún
            </p>
            <p className="text-gray-500 text-sm">
              Comienza tu viaje creando tu primer proyecto
            </p>
            <button
              onClick={() => setShowLanguageModal(true)}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Crear primer proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, idx) => {
              const lang =
                languageInfo[project.language] || languageInfo.waskart;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer animate-slideUp"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Card Preview con efecto glassmorphism */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${lang.color} flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                      >
                        <span className="text-4xl">{lang.icon}</span>
                      </div>
                    </div>
                    {/* Language badge mejorado */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10 shadow-lg`}
                      >
                        {lang.name}
                      </span>
                    </div>
                    {/* Overlay gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-800/90 to-transparent"></div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg truncate group-hover:text-purple-400 transition-colors duration-300">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(project.createdAt)}
                        </p>
                      </div>

                      {/* Menu button mejorado */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(
                              showMenu === project.id ? null : project.id,
                            );
                          }}
                          className="p-2 text-gray-500 hover:text-white rounded-lg transition-all duration-300 hover:bg-gray-700"
                        >
                          <FaEllipsisV className="text-sm" />
                        </button>

                        {showMenu === project.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-10 overflow-hidden animate-slideDown">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProject(project);
                                setNewProjectName(project.name);
                                setShowMenu(null);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors duration-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Renombrar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors duration-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats mejorados */}
                    <div className="flex items-center gap-4 pt-3 border-t border-gray-700/50">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <span>{project.pages?.length || 1} páginas</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                        <span>Privado</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover efecto de brillo */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de lenguaje mejorado */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl transform animate-scaleUp">
            <div className="relative p-6">
              {/* Decoración */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Crear nuevo proyecto
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Elige el lenguaje que prefieras para comenzar
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {/* Waskart */}
                  <div
                    onClick={() => setSelectedLanguage("waskart")}
                    className={`group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedLanguage === "waskart"
                        ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-2 border-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-gray-700/30 border-2 border-gray-600 hover:border-blue-400 hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        Waskart
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Programación tradicional con sintaxis limpia
                      </p>
                    </div>
                    {selectedLanguage === "waskart" && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg animate-pulse">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Quí-roz */}
                  <div
                    onClick={() => setSelectedLanguage("bloques")}
                    className={`group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedLanguage === "bloques"
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                        : "bg-gray-700/30 border-2 border-gray-600 hover:border-purple-400 hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl">🧩</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        Quí-roz
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Programación visual por bloques, ideal para
                        principiantes
                      </p>
                    </div>
                    {selectedLanguage === "bloques" && (
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg animate-pulse">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLanguageModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateProject}
                    disabled={creating}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creando...
                      </div>
                    ) : (
                      "Crear proyecto"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de renombrar mejorado */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl transform animate-scaleUp">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Renombrar proyecto
                </h2>
                <p className="text-gray-400 text-sm">
                  Dale un nombre único a tu proyecto
                </p>
              </div>

              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                autoFocus
                placeholder="Nombre del proyecto"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setNewProjectName("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRenameProject}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }

        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
