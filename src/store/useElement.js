import { create } from "zustand";

const useElementStore = create((set) => ({
  selectedId: null,
  targetId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  setTargetId: (id) => set({ targetId: id }),
}));

export default useElementStore;
