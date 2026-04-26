// components/DeviceWindow.jsx
import React, { useState, useRef, useEffect } from "react";
import { RxReload } from "react-icons/rx";

const DeviceWindow = ({ url, width = 430, height = 932, dpi = 0.4 }) => {
  const windowRef = useRef(null);
  const iframeRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [iframeScale, setIframeScale] = useState(1);

  // 🔥 Calcular dimensiones escaladas correctamente
  const scaledWidth = width * dpi;
  const scaledHeight = height * dpi;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  // 🔥 Calcular escala necesaria para que el contenido del iframe quepa exactamente
  useEffect(() => {
    if (!isIframeLoaded || !iframeRef.current) return;

    const iframe = iframeRef.current;
    try {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;
      const body = iframeDocument.body;
      const html = iframeDocument.documentElement;

      if (body && html) {
        // Obtener dimensiones del contenido
        const contentWidth = Math.max(
          body.scrollWidth,
          body.offsetWidth,
          html.clientWidth,
          html.scrollWidth,
          html.offsetWidth,
        );
        const contentHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight,
        );

        // Calcular escala para que quepa exactamente
        const scaleX = width / contentWidth;
        const scaleY = height / contentHeight;
        const newScale = Math.min(scaleX, scaleY, 1);

        setIframeScale(newScale);
        console.log(
          "📐 Escala calculada:",
          newScale,
          "Contenido:",
          contentWidth,
          "x",
          contentHeight,
        );
      }
    } catch (error) {
      console.error("Error accediendo al iframe:", error);
      setIframeScale(1);
    }
  }, [url, reloadKey, isIframeLoaded, width, height]);

  // 🔥 Centrar al cargar y al cambiar dpi
  useEffect(() => {
    const centerX = (window.innerWidth - scaledWidth) / 2;
    const centerY = (window.innerHeight - scaledHeight) / 2;
    setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
  }, [scaledWidth, scaledHeight]);

  const handlePointerDown = (e) => {
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging.current) return;

    let newX = e.clientX - dragOffset.current.x;
    let newY = e.clientY - dragOffset.current.y;

    newX = Math.max(0, Math.min(newX, window.innerWidth - scaledWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - scaledHeight));

    setPosition({ x: newX, y: newY });
  };

  const handleReload = (e) => {
    e.stopPropagation();
    setIsIframeLoaded(false);
    setReloadKey((prev) => prev + 1);
  };

  const handlePointerUp = (e) => {
    dragging.current = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
  };

  useEffect(() => {
    const handleResize = () => {
      const centerX = (window.innerWidth - scaledWidth) / 2;
      const centerY = (window.innerHeight - scaledHeight) / 2;
      setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scaledWidth, scaledHeight]);

  // 🔥 Inyectar estilos adicionales al iframe para que coincida con el editor
  useEffect(() => {
    if (!isIframeLoaded || !iframeRef.current) return;

    try {
      const iframeDoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow.document;
      const style = iframeDoc.createElement("style");
      style.textContent = `
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background-color: #fff;
        }
      `;
      iframeDoc.head.appendChild(style);
    } catch (error) {
      console.error("Error inyectando estilos:", error);
    }
  }, [isIframeLoaded]);

  return (
    <div
      ref={windowRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: scaledWidth,
        height: scaledHeight,
        borderRadius: 10,
        background: "#000",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
        zIndex: 1000,
      }}
    >
      {/* Marco del dispositivo */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          overflow: "hidden",
          background: "#000",
          cursor: "grab",
          position: "relative",
          border: "4px solid #1a1a1a",
        }}
      >
        {/* Notch / Cámara */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 50,
            height: 15,
            background: "#1b1b1b",
            borderRadius: 20,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 10,
            opacity: 0.3,
          }}
        >
          <button
            onClick={handleReload}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              opacity: 0.7,
            }}
          >
            <RxReload size={12} />
          </button>
        </div>

        {/* Contenedor del iframe con scroll interno */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#fff",
          }}
        >
          <iframe
            ref={iframeRef}
            src={url}
            key={reloadKey}
            title="device-frame"
            onLoad={handleIframeLoad}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              border: "none",
              background: "#fff",
              transform: `scale(${scaledWidth / width})`,
              transformOrigin: "top left",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DeviceWindow;
