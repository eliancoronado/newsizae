// src/tutorial/animations.js

/**
 * Configuraciones de animación para Framer Motion
 * Todas las animaciones usan spring para movimientos naturales
 */

export const cursorAnimations = {
  // Movimiento suave del cursor
  move: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 1,
  },
  // Click: escala rápida
  click: {
    scale: [1, 0.8, 1],
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  // Doble click: dos escalas rápidas
  doubleClick: {
    scale: [1, 0.8, 1, 0.8, 1],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  // Hover: ligera rotación y escala
  hover: {
    scale: 1.1,
    rotate: -5,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  // Drag: movimiento con rebote
  drag: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
    mass: 1.2,
  },
  // Aparecer/desaparecer
  fade: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const overlayAnimations = {
  // Transición del agujero de un elemento a otro
  holeTransition: {
    type: 'spring',
    stiffness: 200,
    damping: 30,
    mass: 1,
  },
  // Fade del overlay
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const tooltipAnimations = {
  // Entrada del tooltip con fade + scale
  entrance: {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 10 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  // Rebote del tooltip
  bounce: {
    type: 'spring',
    stiffness: 500,
    damping: 15,
  },
};

export const highlightAnimations = {
  // Animación de resaltado (glow)
  glow: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0)',
      '0 0 20px 8px rgba(59, 130, 246, 0.3)',
      '0 0 0 0 rgba(59, 130, 246, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  // Escala ligera
  pulse: {
    scale: [1, 1.03, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};