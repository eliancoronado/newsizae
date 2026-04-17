// utils/projectsService.js
import { ref, push, set, get, update, remove, query, orderByChild, equalTo, onValue } from "firebase/database";
import { db } from "../firebase";

// Crear nuevo proyecto
export const createProject = async (authorId, language, name = "Proyecto sin nombre") => {
  try {
    const now = Date.now();
    const projectId = push(ref(db, 'projects')).key;
    
    const projectData = {
      authorId,
      name,
      language,
      createdAt: now,
      updatedAt: now,
      pages: [
        {
          id: push(ref(db, 'temp')).key,
          name: "index",
          elements: [],
          code: "",
          state: {},
          stylesGlobal: []
        }
      ]
    };
    
    await set(ref(db, `projects/${projectId}`), projectData);
    await set(ref(db, `userProjects/${authorId}/${projectId}`), true);
    
    return { id: projectId, ...projectData };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Obtener proyectos de un usuario (versión simplificada para uso único)
export const getUserProjects = async (userId) => {
  try {
    const userProjectsRef = ref(db, `userProjects/${userId}`);
    const snapshot = await get(userProjectsRef);
    const projectsIds = snapshot.val() || {};
    
    const projects = [];
    for (const projectId of Object.keys(projectsIds)) {
      const projectRef = ref(db, `projects/${projectId}`);
      const projectSnapshot = await get(projectRef);
      if (projectSnapshot.exists()) {
        projects.push({ id: projectId, ...projectSnapshot.val() });
      }
    }
    
    projects.sort((a, b) => b.createdAt - a.createdAt);
    return projects;
  } catch (error) {
    console.error("Error getting user projects:", error);
    return [];
  }
};

// Actualizar nombre del proyecto
export const updateProjectName = async (projectId, newName) => {
  try {
    await update(ref(db, `projects/${projectId}`), {
      name: newName,
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Error updating project name:", error);
    return false;
  }
};

// Eliminar proyecto
export const deleteProject = async (projectId, userId) => {
  try {
    await remove(ref(db, `projects/${projectId}`));
    await remove(ref(db, `userProjects/${userId}/${projectId}`));
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    return false;
  }
};

// Escuchar proyectos en tiempo real (VERSIÓN CORREGIDA)
export const listenUserProjects = (userId, callback) => {
  console.log("🔍 [projectsService] Iniciando listener para usuario:", userId);
  
  const userProjectsRef = ref(db, `userProjects/${userId}`);
  
  const unsubscribe = onValue(userProjectsRef, async (snapshot) => {
    console.log("📦 [projectsService] userProjects snapshot:", snapshot.val());
    const projectsIds = snapshot.val() || {};
    const projects = [];
    
    console.log("📊 [projectsService] IDs de proyectos encontrados:", Object.keys(projectsIds).length);
    
    for (const projectId of Object.keys(projectsIds)) {
      console.log("🔍 [projectsService] Buscando proyecto:", projectId);
      const projectRef = ref(db, `projects/${projectId}`);
      const projectSnapshot = await get(projectRef);
      if (projectSnapshot.exists()) {
        console.log("✅ [projectsService] Proyecto encontrado:", projectSnapshot.val());
        projects.push({ id: projectId, ...projectSnapshot.val() });
      } else {
        console.log("❌ [projectsService] Proyecto no encontrado:", projectId);
      }
    }
    
    projects.sort((a, b) => b.createdAt - a.createdAt);
    console.log("🎯 [projectsService] Proyectos finales:", projects.length);
    callback(projects);
  }, (error) => {
    console.error("❌ [projectsService] Error en listener:", error);
    callback([]);
  });
  
  return unsubscribe;
};