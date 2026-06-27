import { useEffect, useRef } from "react";
import { useMutation } from "@liveblocks/react";

export default function useRealtimeUIState({
  mode,
  setMode,
  selectedPage,
  setSelectedPage,
  selectedElement,
  setSelectedElement,
}) {
  const timeout = useRef(null);
  const lastLocalValue = useRef(null);

  // Enviar
  const update = useMutation(({ storage }, value) => {
    let state = storage.get("uiState");

    if (!state) {
      storage.set("uiState", value);
      return;
    }

    state.set("mode", value.mode);
    state.set("selectedPage", value.selectedPage);
    state.set("selectedElement", value.selectedElement);
  }, []);

  useEffect(() => {
    const value = {
      mode,
      selectedPage,
      selectedElement,
    };

    if (JSON.stringify(value) === JSON.stringify(lastLocalValue.current)) {
      return;
    }

    lastLocalValue.current = value;

    clearTimeout(timeout.current);

    timeout.current = setTimeout(() => {
      update(value);
    }, 100);

    return () => clearTimeout(timeout.current);
  }, [mode, selectedPage, selectedElement, update]);
}