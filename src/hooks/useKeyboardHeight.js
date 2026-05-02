// hooks/useKeyboardHandler.js
import { useEffect, useState, useRef } from "react";

export const useKeyboardHandler = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    };

    const handleResize = () => {
      // Detectar teclado en móvil
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const windowHeight = window.innerHeight;
        const viewportHeight = visualViewport.height;
        const diff = windowHeight - viewportHeight;

        if (diff > 150) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(diff);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);

    if (inputRef.current) {
      inputRef.current.addEventListener("focus", handleFocus);
    }

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
      if (inputRef.current) {
        inputRef.current.removeEventListener("focus", handleFocus);
      }
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen, inputRef, containerRef };
};
