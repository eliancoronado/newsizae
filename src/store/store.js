//https://sizaebuilder-backend.onrender.com
import { create } from "zustand";

const useStore = create((set) => ({
  mode: "elements",
  setMode: (mode) => set({ mode }),

  droppedElements: [],
  setDroppedElements: (elements) => set({ droppedElements: elements }),

  updatedOElements: [],
  setUpdatedOElements: (elements) => set({ updatedOElements: elements }),

  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),

  imgSelected: "",
  setImgSelected: (img) => set({ imgSelected: img }),

  projectData: {},
  setProjectData: (data) => set({ projectData: data }),

  blocklyCode: null,
  setBlockyCode: (code) => set({ blocklyCode: code }),

  workspaceState: "", // Estado del workspace de blockly
  setWorkspaceState: (state) => set({ workspaceState: state }),

  socket: null,
  setSocket: (socket) => set({ socket }),

  // Estado para elementos compartidos
  sharedElements: [],
  addSharedElement: (element) =>
    set((state) => ({ sharedElements: [...state.sharedElements, element] })),

  // Limpiar elementos compartidos
  clearSharedElements: () => set({ sharedElements: [] }),

  selectedPage: "index",
  setSelectedPage: (page) => set({ selectedPage: page }),
  //https://sizaebuilder-backend.onrender.com
  url: "http://localhost:9000", // Puedes configurar esto desde el inicio
  setUrl: (newUrl) => set({ url: newUrl }),

  draggingElement: null,
  setDraggingElement: (element) => set({ draggingElement: element }),
}));

export default useStore;
