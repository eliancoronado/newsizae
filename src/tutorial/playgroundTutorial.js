// src/tutorial/tutorials/playgroundTutorial.js

/**
 * Tutorial para el modo Playground de Baboo
 * Enseña al usuario cómo usar el editor visual
 */
export const playgroundTutorial = [
  {
    id: 'welcome',
    action: 'move',
    target: '#menu', // Asumiendo que el menú tiene este ID
    text: '👋 ¡Bienvenido al modo Playground de Baboo!',
    title: '¡Hola!',
    placement: 'center',
    autoAdvance: false,
    duration: 800,
  },
  {
    id: 'sidebar-intro',
    action: 'move',
    target: '.sidebar-left', // Selector para el sidebar izquierdo
    text: 'Aquí tienes los componentes que puedes arrastrar al canvas.',
    title: 'Componentes',
    placement: 'right',
    autoAdvance: false,
    duration: 500,
  },
  {
    id: 'add-intro',
    action: 'move',
    target: '#add-element', // Selector para el sidebar izquierdo
    text: 'Aquí podras ver componentes que puedes arrastrar al canvas.',
    title: 'Agregar',
    placement: 'right',
    autoAdvance: false,
    duration: 500,
  },
  {
    id: 'ele-intro',
    action: 'move',
    target: '#ele-element', // Selector para el sidebar izquierdo
    text: 'Aquí podras ver el arbol de elementos que tienes en el canvas.',
    title: 'Seleccionar',
    placement: 'right',
    autoAdvance: false,
    duration: 500,
  },
  {
    id: 'ia-intro',
    action: 'move',
    target: '#ia-element', // Selector para el sidebar izquierdo
    text: 'Aquí podras usar nuestra IA para generar diseños y pantallas',
    title: 'Baboo AI',
    placement: 'right',
    autoAdvance: false,
    duration: 500,
  },
  {
    id: 'up-intro',
    action: 'move',
    target: '#upl-element', // Selector para el sidebar izquierdo
    text: 'Aquí podras subir imagenes para usar en las pantallas',
    title: 'Subir archivos',
    placement: 'right',
    autoAdvance: false,
    duration: 500,
  },
  {
    id: 'sty-intro',
    action: 'move',
    target: '#sty-element', // Selector para el sidebar izquierdo
    text: 'Aquí podras crear tus propios estilos personalizados para tus elementos',
    title: 'Estilar',
    placement: 'right',
    autoAdvance: false,
    duration: 500,
  },
  {
    id: 'sidebar-drag',
    action: 'drag',
    target: '.sidebar-left .component-item:first-child', // Primer componente
    //to: '#menu', // Canvas central
    text: 'Arrastra este componente al canvas para agregarlo a tu diseño.',
    title: 'Arrastrar Componente',
    placement: 'bottom',
    autoAdvance: false,
    duration: 1500,
  },
  {
    id: 'properties-intro',
    action: 'move',
    target: '.right-panel', // Panel de propiedades
    text: 'Selecciona un elemento en el canvas para editar sus propiedades.',
    title: 'Propiedades',
    placement: 'left',
    autoAdvance: false,
    duration: 500,
  },
  {
    id: 'complete',
    action: 'move',
    target: '#menu',
    text: '🎉 ¡Excelente! Has aprendido a usar el modo Playground.',
    title: '¡Completado!',
    placement: 'center',
    autoAdvance: false, 
    duration: 1000,
  },
];

/**
 * Tutorial de bienvenida para nuevos usuarios
 */
export const welcomeTutorial = [
  {
    id: 'welcome',
    action: 'move',
    target: 'body',
    text: '👋 Bienvenido a Baboo, tu editor visual no-code.',
    title: 'Bienvenido',
    placement: 'center',
    duration: 800,
  },
  {
    id: 'create-project',
    action: 'click',
    target: '#create-project-btn',
    text: 'Haz clic aquí para crear tu primer proyecto.',
    title: 'Crear Proyecto',
    placement: 'bottom',
    duration: 500,
  },
];

export default playgroundTutorial;