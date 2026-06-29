// src/tutorial/Overlay.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { overlayAnimations } from './animations';

/**
 * Overlay - Capa oscura con agujero transparente
 * 
 * Usa SVG con clip-path para crear el efecto de agujero
 */
const Overlay = ({
  visible = false,
  targetRect = null,
  padding = 16,
  radius = 8,
  blur = 4,
  opacity = 0.7,
  onClick = null,
}) => {
  const [rect, setRect] = useState(targetRect);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Actualizar rect cuando cambia
  useEffect(() => {
    if (targetRect) {
      setRect(targetRect);
    }
  }, [targetRect]);

  // Actualizar tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!visible || !rect) return null;

  const { width, height } = windowSize;
  
  // Calcular el rectángulo del agujero con padding
  const holeX = rect.left - padding;
  const holeY = rect.top - padding;
  const holeWidth = rect.width + padding * 2;
  const holeHeight = rect.height + padding * 2;

  // Crear el clip-path para el agujero
  const clipPath = `
    M0,0 
    L${width},0 
    L${width},${height} 
    L0,${height} 
    Z
    M${holeX},${holeY}
    L${holeX + holeWidth},${holeY}
    L${holeX + holeWidth},${holeY + holeHeight}
    L${holeX},${holeY + holeHeight}
    Z
  `;

  // Crear el SVG con el clip-path
  const clipRule = 'evenodd';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9998] pointer-events-none"
          initial={overlayAnimations.fade.initial}
          animate={overlayAnimations.fade.animate}
          exit={overlayAnimations.fade.exit}
          transition={overlayAnimations.fade.transition}
        >
          <svg
            width={width}
            height={height}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          >
            <defs>
              <clipPath id="holeClip">
                <path
                  d={clipPath}
                  fillRule={clipRule}
                />
              </clipPath>
              
              {/* Efecto de blur */}
              <filter id="blurFilter">
                <feGaussianBlur stdDeviation={blur} />
              </filter>
            </defs>
            
            {/* Fondo oscuro */}
            <rect
              width={width}
              height={height}
              fill={`rgba(0, 0, 0, ${opacity})`}
              clipPath="url(#holeClip)"
            />
            
            {/* Borde alrededor del agujero */}
            <rect
              x={holeX - 2}
              y={holeY - 2}
              width={holeWidth + 4}
              height={holeHeight + 4}
              rx={radius}
              ry={radius}
              fill="none"
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth={2}
              clipPath="url(#holeClip)"
            />
          </svg>
          
          {/* Elemento overlay clickeable (para cerrar) */}
          {onClick && (
            <div
              className="absolute inset-0 pointer-events-auto cursor-pointer"
              onClick={onClick}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Overlay;