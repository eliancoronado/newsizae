// hooks/useKeyboardHeight.js
import { useEffect, useState } from "react";

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      // En móviles, cuando el teclado aparece, el viewport cambia
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const windowHeight = window.innerHeight;
        const viewportHeight = visualViewport.height;
        const diff = windowHeight - viewportHeight;
        setKeyboardHeight(diff > 0 ? diff : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      handleResize(); // Ejecutar al inicio
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return keyboardHeight;
};
