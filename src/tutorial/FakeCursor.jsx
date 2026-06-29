// src/tutorial/FakeCursor.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cursorAnimations } from './animations';

/**
 * FakeCursor - Cursor falso animado con SVG
 * 
 * Escucha eventos del TutorialEngine para moverse, hacer click, etc.
 */
const FakeCursor = ({ 
  size = 32, 
  visible = true,
  color = '#3B82F6',
}) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(visible);
  const [isClicking, setIsClicking] = useState(false);
  const [isDoubleClicking, setIsDoubleClicking] = useState(false);
  const [isRightClicking, setIsRightClicking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragTo, setDragTo] = useState(null);
  const [dragProgress, setDragProgress] = useState(0);
  
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Escuchar eventos de movimiento del cursor
    const handleMove = (e) => {
      const { x, y } = e.detail;
      setPosition({ x, y });
      setIsVisible(true);
    };

    const handleClick = (e) => {
      const { x, y } = e.detail;
      setPosition({ x, y });
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 200);
    };

    const handleDoubleClick = (e) => {
      const { x, y } = e.detail;
      setPosition({ x, y });
      setIsDoubleClicking(true);
      setTimeout(() => setIsDoubleClicking(false), 400);
    };

    const handleRightClick = (e) => {
      const { x, y } = e.detail;
      setPosition({ x, y });
      setIsRightClicking(true);
      setTimeout(() => setIsRightClicking(false), 200);
    };

    const handleDrag = (e) => {
      const { from, to, step } = e.detail;
      setDragFrom(from);
      setDragTo(to);
      setDragProgress(0);
      setIsDragging(true);
      
      // Animar el drag progresivamente
      const startTime = Date.now();
      const duration = step?.duration || 1000;
      
      const animateDrag = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setDragProgress(progress);
        
        // Actualizar posición interpolada
        const x = from.x + (to.x - from.x) * progress;
        const y = from.y + (to.y - from.y) * progress;
        setPosition({ x, y });
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateDrag);
        } else {
          setPosition({ x: to.x, y: to.y });
          setIsDragging(false);
          setDragFrom(null);
          setDragTo(null);
        }
      };
      
      animateDrag();
    };

    const handleHover = (e) => {
      const { x, y } = e.detail;
      setPosition({ x, y });
      setIsHovering(true);
      setTimeout(() => setIsHovering(false), 300);
    };

    const handleType = (e) => {
      const { x, y } = e.detail;
      setPosition({ x, y });
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 200);
    };

    const handleDestroy = () => {
      setIsVisible(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    // Registrar event listeners
    window.addEventListener('tutorial:cursor:move', handleMove);
    window.addEventListener('tutorial:cursor:click', handleClick);
    window.addEventListener('tutorial:cursor:doubleClick', handleDoubleClick);
    window.addEventListener('tutorial:cursor:rightClick', handleRightClick);
    window.addEventListener('tutorial:cursor:drag', handleDrag);
    window.addEventListener('tutorial:cursor:hover', handleHover);
    window.addEventListener('tutorial:cursor:type', handleType);
    window.addEventListener('tutorial:destroy', handleDestroy);

    return () => {
      window.removeEventListener('tutorial:cursor:move', handleMove);
      window.removeEventListener('tutorial:cursor:click', handleClick);
      window.removeEventListener('tutorial:cursor:doubleClick', handleDoubleClick);
      window.removeEventListener('tutorial:cursor:rightClick', handleRightClick);
      window.removeEventListener('tutorial:cursor:drag', handleDrag);
      window.removeEventListener('tutorial:cursor:hover', handleHover);
      window.removeEventListener('tutorial:cursor:type', handleType);
      window.removeEventListener('tutorial:destroy', handleDestroy);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Efecto para ocultar/mostrar
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  if (!isVisible) return null;

  // Calcular escala para animaciones
  const getScale = () => {
    if (isClicking) return 0.8;
    if (isDoubleClicking) return 0.8;
    if (isRightClicking) return 0.8;
    if (isHovering) return 1.1;
    if (isDragging) return 1.2;
    if (isTyping) return 0.9;
    return 1;
  };

  // Calcular rotación
  const getRotation = () => {
    if (isHovering) return -5;
    if (isDragging) return 10;
    return 0;
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 99999,
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
      }}
      animate={{
        x: position.x - size / 2,
        y: position.y - size / 2,
        scale: getScale(),
        rotate: getRotation(),
      }}
      transition={cursorAnimations.move}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sombra del cursor */}
        <motion.g
          animate={{
            opacity: isDragging ? 0.3 : 0.15,
          }}
        >
          <path
            d="M6 2L26 16L16 18L22 28L18 30L12 20L6 26V2Z"
            fill="#000"
            opacity={0.3}
            transform="translate(2, 2)"
          />
        </motion.g>

        {/* Cursor principal */}
        <motion.path
          d="M6 2L26 16L16 18L22 28L18 30L12 20L6 26V2Z"
          fill={color}
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            fill: isDragging ? '#8B5CF6' : color,
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Punto de click */}
        <AnimatePresence>
          {isClicking && (
            <motion.circle
              cx="16"
              cy="16"
              r="12"
              fill="rgba(59, 130, 246, 0.3)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Onda de doble click */}
        <AnimatePresence>
          {isDoubleClicking && (
            <>
              <motion.circle
                cx="16"
                cy="16"
                r="8"
                fill="rgba(59, 130, 246, 0.2)"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.5 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
              <motion.circle
                cx="16"
                cy="16"
                r="8"
                fill="rgba(59, 130, 246, 0.2)"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.5 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Texto de arrastre */}
        {isDragging && dragFrom && dragTo && (
          <motion.text
            x="16"
            y="36"
            textAnchor="middle"
            fontSize="8"
            fill={color}
            fontWeight="bold"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⇄ Arrastrando
          </motion.text>
        )}

        {/* Línea de arrastre */}
        {isDragging && dragFrom && dragTo && (
          <motion.line
            x1={dragFrom.x - position.x + size/2}
            y1={dragFrom.y - position.y + size/2}
            x2={dragTo.x - position.x + size/2}
            y2={dragTo.y - position.y + size/2}
            stroke={color}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity={0.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
          />
        )}
      </svg>
    </motion.div>
  );
};

export default FakeCursor;