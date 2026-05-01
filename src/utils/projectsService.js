// utils/projectsService.js
import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  onValue,
} from "firebase/database";
import { db } from "../firebase";

// Obtener proyectos del usuario (incluyendo compartidos)
// utils/projectsService.js

export const getUserProjects = async (userId) => {
  if (!userId) return [];

  try {
    const userProjectsRef = ref(db, `userProjects/${userId}`);
    const snapshot = await get(userProjectsRef);
    const userProjects = snapshot.val() || {};

    const projectsList = [];

    // Obtener proyectos creados por el usuario
    for (const projectId of Object.keys(userProjects)) {
      try {
        const projectRef = ref(db, `projects/${projectId}`);
        const projectSnapshot = await get(projectRef);

        if (projectSnapshot.exists()) {
          const project = projectSnapshot.val();
          projectsList.push({
            id: projectId,
            ...project,
            isShared: false,
            originalAuthor: null,
          });
        }
      } catch (err) {
        console.error(`Error loading project ${projectId}:`, err);
      }
    }

    // Obtener proyectos compartidos con el usuario (donde tiene rol editor)
    try {
      const sharedProjectsRef = ref(db, `sharedProjects/${userId}`);
      const sharedSnapshot = await get(sharedProjectsRef);
      const sharedProjects = sharedSnapshot.val() || {};

      for (const [projectId, sharedData] of Object.entries(sharedProjects)) {
        if (sharedData.role === "editor") {
          try {
            const projectRef = ref(db, `projects/${projectId}`);
            const projectSnapshot = await get(projectRef);

            if (projectSnapshot.exists()) {
              const project = projectSnapshot.val();
              projectsList.push({
                id: projectId,
                ...project,
                isShared: true,
                originalAuthor: project.authorName || "Usuario",
              });
            }
          } catch (err) {
            console.error(`Error loading shared project ${projectId}:`, err);
          }
        }
      }
    } catch (err) {
      console.error("Error loading shared projects:", err);
    }

    return projectsList;
  } catch (error) {
    console.error("Error getting user projects:", error);
    return [];
  }
};

// Compartir proyecto con un amigo
export const shareProject = async (
  projectId,
  ownerId,
  friendId,
  friendName,
  friendPhoto,
  role,
) => {
  try {
    const projectRef = ref(db, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    const project = projectSnapshot.val();

    if (!project) throw new Error("Proyecto no encontrado");
    if (project.authorId !== ownerId)
      throw new Error("No tienes permiso para compartir este proyecto");

    // Actualizar el campo share del proyecto
    const shareRef = ref(db, `projects/${projectId}/share/${friendId}`);
    await set(shareRef, {
      role: role,
      name: friendName,
      photo: friendPhoto,
      sharedAt: Date.now(),
    });

    // Agregar a sharedProjects del amigo
    const userSharedRef = ref(db, `sharedProjects/${friendId}/${projectId}`);
    await set(userSharedRef, {
      role: role,
      ownerId: ownerId,
      ownerName: project.authorName,
      sharedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error("Error sharing project:", error);
    throw error;
  }
};

// Registrar cambio en el historial del proyecto
export const addProjectHistory = async (
  projectId,
  userId,
  userName,
  action,
  projectName,
) => {
  try {
    const historyRef = ref(db, `projects/${projectId}/history`);
    const newHistoryRef = push(historyRef);
    await set(newHistoryRef, {
      userId: userId,
      userName: userName,
      action: action,
      projectName: projectName,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error adding project history:", error);
  }
};

// Obtener historial de cambios de un proyecto
export const getProjectHistory = async (projectId) => {
  try {
    const historyRef = ref(db, `projects/${projectId}/history`);
    const snapshot = await get(historyRef);
    const history = snapshot.val() || {};

    return Object.entries(history)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting project history:", error);
    return [];
  }
};

// Actualizar el createProject para incluir share
export const createProject = async (userId, language, userName) => {
  try {
    const newProjectRef = push(ref(db, "projects"));
    const projectId = newProjectRef.key;

    const projectData = {
      authorId: userId,
      authorName: userName,
      name: `Proyecto ${language === "waskart" ? "Waskart" : "Quí-roz"}`,
      language: language,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      share: {}, // Campo para usuarios compartidos
      pages: [
        {
          name: "index",
          elements: [],
          stylesGlobal: [],
          code: "",
          state: {},
        },
      ],
    };

    await set(newProjectRef, projectData);

    const userProjectRef = ref(db, `userProjects/${userId}/${projectId}`);
    await set(userProjectRef, true);

    return { id: projectId, ...projectData };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Crear nuevo proyecto
/*
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
*/

// Actualizar nombre del proyecto
export const updateProjectName = async (projectId, newName) => {
  try {
    await update(ref(db, `projects/${projectId}`), {
      name: newName,
      updatedAt: Date.now(),
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

  const unsubscribe = onValue(
    userProjectsRef,
    async (snapshot) => {
      console.log(
        "📦 [projectsService] userProjects snapshot:",
        snapshot.val(),
      );
      const projectsIds = snapshot.val() || {};
      const projects = [];

      console.log(
        "📊 [projectsService] IDs de proyectos encontrados:",
        Object.keys(projectsIds).length,
      );

      for (const projectId of Object.keys(projectsIds)) {
        console.log("🔍 [projectsService] Buscando proyecto:", projectId);
        const projectRef = ref(db, `projects/${projectId}`);
        const projectSnapshot = await get(projectRef);
        if (projectSnapshot.exists()) {
          console.log(
            "✅ [projectsService] Proyecto encontrado:",
            projectSnapshot.val(),
          );
          projects.push({ id: projectId, ...projectSnapshot.val() });
        } else {
          console.log(
            "❌ [projectsService] Proyecto no encontrado:",
            projectId,
          );
        }
      }

      projects.sort((a, b) => b.createdAt - a.createdAt);
      console.log("🎯 [projectsService] Proyectos finales:", projects.length);
      callback(projects);
    },
    (error) => {
      console.error("❌ [projectsService] Error en listener:", error);
      callback([]);
    },
  );

  return unsubscribe;
};
