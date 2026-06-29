// src/tutorial/constants.js

/**
 * Estados posibles de la máquina de estados del tutorial
 */
export const TUTORIAL_STATES = {
  IDLE: 'idle',           // Sin ejecutar
  MOVING: 'moving',       // Moviendo el cursor
  HOVERING: 'hovering',   // Haciendo hover
  CLICKING: 'clicking',   // Haciendo clic
  DRAGGING: 'dragging',   // Arrastrando
  TYPING: 'typing',       // Escribiendo
  WAITING: 'waiting',     // Esperando
  COMPLETED: 'completed', // Completado
  SKIPPED: 'skipped',     // Saltado
};

/**
 * Acciones soportadas por el motor
 */
export const ACTIONS = {
  MOVE: 'move',
  CLICK: 'click',
  DOUBLE_CLICK: 'doubleClick',
  RIGHT_CLICK: 'rightClick',
  DRAG: 'drag',
  HOVER: 'hover',
  SCROLL: 'scroll',
  TYPE: 'type',
  WAIT: 'wait',
  HIGHLIGHT: 'highlight',
  CUSTOM: 'custom',
};

/**
 * Posiciones para el tooltip (Floating UI)
 */
export const TOOLTIP_PLACEMENTS = [
  'top',
  'bottom',
  'left',
  'right',
  'top-start',
  'top-end',
  'bottom-start',
  'bottom-end',
  'left-start',
  'left-end',
  'right-start',
  'right-end',
];

/**
 * Configuración por defecto
 */
export const DEFAULT_CONFIG = {
  duration: 500,        // Duración de animaciones (ms)
  delay: 0,            // Retraso antes de ejecutar
  padding: 16,         // Padding del overlay
  radius: 8,           // Border-radius del overlay
  cursorSize: 32,      // Tamaño del cursor falso
  scrollBehavior: 'smooth',
  typeSpeed: 50,       // Velocidad de escritura (ms por letra)
};