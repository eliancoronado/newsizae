// src/tutorial/utils.js

/**
 * Obtiene un elemento del DOM usando un selector
 * @param {string} selector - Selector CSS (ej: '#menu', '.button')
 * @returns {HTMLElement|null}
 */
export const getElement = (selector) => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn(`[Tutorial] Elemento no encontrado: ${selector}`);
    return null;
  }
};

/**
 * Obtiene la posición de un elemento usando getBoundingClientRect
 * @param {string|HTMLElement} target - Selector o elemento DOM
 * @returns {DOMRect|null} - Rectángulo del elemento o null si no existe
 */
export const getElementRect = (target) => {
  const element = typeof target === 'string' ? getElement(target) : target;
  if (!element) return null;
  return element.getBoundingClientRect();
};

/**
 * Hace scroll automático al elemento si está fuera de la vista
 * @param {string|HTMLElement} target - Selector o elemento DOM
 * @param {string} behavior - 'smooth' o 'auto'
 * @returns {Promise} - Resuelve cuando el scroll termina
 */
export const scrollToElement = (target, behavior = 'smooth') => {
  return new Promise((resolve) => {
    const element = typeof target === 'string' ? getElement(target) : target;
    if (!element) {
      resolve();
      return;
    }

    const rect = element.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

    if (!isVisible) {
      element.scrollIntoView({
        behavior,
        block: 'center',
        inline: 'center',
      });

      // Esperar a que termine el scroll
      let timeout = 500;
      if (behavior === 'smooth') timeout = 800;
      setTimeout(resolve, timeout);
    } else {
      resolve();
    }
  });
};

/**
 * Espera un tiempo determinado
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise}
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calcula el centro de un elemento
 * @param {DOMRect} rect
 * @returns {{x: number, y: number}}
 */
export const getCenter = (rect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

/**
 * Genera un ID único para pasos
 * @returns {string}
 */
export const generateStepId = () => {
  return `step-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
};

/**
 * Valida que un paso tenga la estructura correcta
 * @param {object} step
 * @returns {boolean}
 */
export const isValidStep = (step) => {
  return step && typeof step === 'object' && step.id && step.action && step.target;
};

/**
 * Simula escritura letra por letra
 * @param {HTMLInputElement|HTMLTextAreaElement} input
 * @param {string} text
 * @param {number} speed - Velocidad en ms por letra
 * @returns {Promise}
 */
export const typeText = (input, text, speed = 50) => {
  return new Promise((resolve) => {
    if (!input || !text) {
      resolve();
      return;
    }

    let index = 0;
    input.focus();
    input.value = '';

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        input.value += text[index];
        // Disparar evento para que React detecte el cambio
        input.dispatchEvent(new Event('input', { bubbles: true }));
        index++;
      } else {
        clearInterval(typeInterval);
        resolve();
      }
    }, speed);
  });
};

/**
 * Obtiene el selector más específico para un elemento
 * @param {HTMLElement} element
 * @returns {string}
 */
export const getBestSelector = (element) => {
  if (element.id) return `#${element.id}`;
  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean);
    if (classes.length) return `.${classes.join('.')}`;
  }
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    return `${tag}:nth-child(${index})`;
  }
  return tag;
};