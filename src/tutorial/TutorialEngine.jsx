// src/tutorial/TutorialEngine.jsx

import { TUTORIAL_STATES, ACTIONS, DEFAULT_CONFIG } from './constants';
import {
  getElement,
  getElementRect,
  scrollToElement,
  wait,
  getCenter,
  typeText,
} from './utils';

/**
 * TutorialEngine - Motor principal que ejecuta los pasos del tutorial
 * 
 * Gestiona la máquina de estados y la ejecución de cada paso
 */
class TutorialEngine {
  constructor({ steps, onStepChange, onComplete, onSkip }) {
    this.steps = steps;
    this.currentIndex = 0;
    this.isRunning = false;
    this.isDestroyed = false;
    this.onStepChange = onStepChange || (() => {});
    this.onComplete = onComplete || (() => {});
    this.onSkip = onSkip || (() => {});
    this.config = { ...DEFAULT_CONFIG };
    this.currentStep = null;
    this.abortController = null;
  }

  /**
   * Inicia la ejecución del tutorial
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentIndex = 0;

    await this.runStep(this.currentIndex);
  }

  /**
   * Ejecuta un paso específico
   */
  async runStep(index) {
    if (this.isDestroyed) return;

    const step = this.steps[index];
    if (!step) {
      await this.finish();
      return;
    }

    this.currentStep = step;
    this.onStepChange(step, index);

    // Verificar condición
    if (step.condition && typeof step.condition === 'function') {
      const shouldRun = await step.condition();
      if (!shouldRun) {
        // Saltar este paso
        await this.next();
        return;
      }
    }

    // Ejecutar before()
    if (step.before && typeof step.before === 'function') {
      await step.before();
    }

    // Obtener elemento objetivo
    let targetElement = null;
    if (step.target && step.target !== 'body') {
      targetElement = getElement(step.target);
      if (!targetElement) {
        console.warn(`[Tutorial] Elemento no encontrado: ${step.target}`);
        await this.next();
        return;
      }

      // Scroll automático
      if (step.scroll !== false) {
        await scrollToElement(targetElement, this.config.scrollBehavior);
      }
    }

    // Ejecutar la acción según el tipo
    switch (step.action) {
      case ACTIONS.MOVE:
        await this.executeMove(targetElement, step);
        break;
      case ACTIONS.CLICK:
        await this.executeClick(targetElement, step);
        break;
      case ACTIONS.DOUBLE_CLICK:
        await this.executeDoubleClick(targetElement, step);
        break;
      case ACTIONS.RIGHT_CLICK:
        await this.executeRightClick(targetElement, step);
        break;
      case ACTIONS.DRAG:
        await this.executeDrag(targetElement, step);
        break;
      case ACTIONS.HOVER:
        await this.executeHover(targetElement, step);
        break;
      case ACTIONS.TYPE:
        await this.executeType(targetElement, step);
        break;
      case ACTIONS.WAIT:
        await this.executeWait(step);
        break;
      case ACTIONS.HIGHLIGHT:
        await this.executeHighlight(targetElement, step);
        break;
      case ACTIONS.CUSTOM:
        await this.executeCustom(step);
        break;
      default:
        console.warn(`[Tutorial] Acción desconocida: ${step.action}`);
        await this.next();
    }

    // Ejecutar after()
    if (step.after && typeof step.after === 'function') {
      await step.after();
    }

    // No avanzar automáticamente si es una acción que requiere interacción
    const autoAdvance = step.autoAdvance !== false;
    if (autoAdvance && !this.isDestroyed) {
      // Esperar la duración configurada
      const delay = step.duration || this.config.duration;
      await wait(delay);
      await this.next();
    }
  }

  /**
   * Ejecuta la acción MOVE (mover el cursor)
   */
  async executeMove(targetElement, step) {
    const rect = targetElement ? getElementRect(targetElement) : null;
    const position = rect ? getCenter(rect) : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Emitir evento de movimiento para que FakeCursor lo escuche
    window.dispatchEvent(new CustomEvent('tutorial:cursor:move', {
      detail: { x: position.x, y: position.y, step },
    }));

    // Esperar a que la animación termine
    await wait(step.duration || this.config.duration);
  }

  /**
   * Ejecuta la acción CLICK
   */
  async executeClick(targetElement, step) {
    const rect = getElementRect(targetElement);
    const position = rect ? getCenter(rect) : { x: 0, y: 0 };

    // Emitir evento de click
    window.dispatchEvent(new CustomEvent('tutorial:cursor:click', {
      detail: { x: position.x, y: position.y, step, element: targetElement },
    }));

    // Simular click real en el elemento
    if (targetElement) {
      targetElement.click();
      targetElement.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: position.x,
        clientY: position.y,
      }));
    }

    await wait(300);
  }

  /**
   * Ejecuta la acción DOUBLE_CLICK
   */
  async executeDoubleClick(targetElement, step) {
    const rect = getElementRect(targetElement);
    const position = rect ? getCenter(rect) : { x: 0, y: 0 };

    window.dispatchEvent(new CustomEvent('tutorial:cursor:doubleClick', {
      detail: { x: position.x, y: position.y, step, element: targetElement },
    }));

    if (targetElement) {
      targetElement.dispatchEvent(new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        clientX: position.x,
        clientY: position.y,
      }));
    }

    await wait(300);
  }

  /**
   * Ejecuta la acción RIGHT_CLICK
   */
  async executeRightClick(targetElement, step) {
    const rect = getElementRect(targetElement);
    const position = rect ? getCenter(rect) : { x: 0, y: 0 };

    window.dispatchEvent(new CustomEvent('tutorial:cursor:rightClick', {
      detail: { x: position.x, y: position.y, step, element: targetElement },
    }));

    if (targetElement) {
      targetElement.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: position.x,
        clientY: position.y,
        button: 2,
      }));
    }

    await wait(300);
  }

  /**
   * Ejecuta la acción DRAG (arrastrar y soltar)
   */
  async executeDrag(targetElement, step) {
    const fromRect = getElementRect(targetElement);
    if (!fromRect) {
      await this.next();
      return;
    }

    // Obtener elemento destino
    let toElement = null;
    let toRect = null;
    if (step.to) {
      toElement = getElement(step.to);
      toRect = toElement ? getElementRect(toElement) : null;
    }

    const fromPos = getCenter(fromRect);
    const toPos = toRect ? getCenter(toRect) : { x: fromPos.x + 200, y: fromPos.y + 100 };

    // Emitir evento de drag
    window.dispatchEvent(new CustomEvent('tutorial:cursor:drag', {
      detail: {
        from: fromPos,
        to: toPos,
        step,
        element: targetElement,
        toElement,
      },
    }));

    // Simular drag and drop
    if (targetElement) {
      // Mousedown
      targetElement.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        clientX: fromPos.x,
        clientY: fromPos.y,
      }));

      await wait(100);

      // Mousemove (durante el drag)
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = fromPos.x + (toPos.x - fromPos.x) * t;
        const y = fromPos.y + (toPos.y - fromPos.y) * t;
        document.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true,
          clientX: x,
          clientY: y,
        }));
        await wait(50);
      }

      await wait(100);

      // Mouseup (soltar)
      if (toElement) {
        toElement.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          clientX: toPos.x,
          clientY: toPos.y,
        }));
        toElement.dispatchEvent(new MouseEvent('drop', {
          bubbles: true,
          clientX: toPos.x,
          clientY: toPos.y,
        }));
      }
    }

    // Esperar a que termine el drag
    await wait(step.duration || this.config.duration);
  }

  /**
   * Ejecuta la acción HOVER
   */
  async executeHover(targetElement, step) {
    const rect = getElementRect(targetElement);
    const position = rect ? getCenter(rect) : { x: 0, y: 0 };

    window.dispatchEvent(new CustomEvent('tutorial:cursor:hover', {
      detail: { x: position.x, y: position.y, step, element: targetElement },
    }));

    if (targetElement) {
      targetElement.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true,
        clientX: position.x,
        clientY: position.y,
      }));
    }

    await wait(step.duration || this.config.duration);
  }

  /**
   * Ejecuta la acción TYPE (escritura automática)
   */
  async executeType(targetElement, step) {
    if (!step.value) {
      await this.next();
      return;
    }

    const input = targetElement || document.activeElement;
    if (!input || !(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
      console.warn('[Tutorial] El elemento objetivo no es un input válido');
      await this.next();
      return;
    }

    const speed = step.typeSpeed || this.config.typeSpeed;
    await typeText(input, step.value, speed);

    await wait(300);
  }

  /**
   * Ejecuta la acción WAIT (esperar)
   */
  async executeWait(step) {
    const duration = step.duration || this.config.duration;
    await wait(duration);
  }

  /**
   * Ejecuta la acción HIGHLIGHT (resaltar)
   */
  async executeHighlight(targetElement, step) {
    if (!targetElement) {
      await this.next();
      return;
    }

    const rect = getElementRect(targetElement);

    window.dispatchEvent(new CustomEvent('tutorial:highlight', {
      detail: {
        rect,
        element: targetElement,
        step,
        padding: step.padding || this.config.padding,
        radius: step.radius || this.config.radius,
      },
    }));

    await wait(step.duration || this.config.duration);
  }

  /**
   * Ejecuta la acción CUSTOM (acción personalizada)
   */
  async executeCustom(step) {
    if (step.handler && typeof step.handler === 'function') {
      await step.handler({
        step,
        next: () => this.next(),
        prev: () => this.previous(),
        wait,
      });
    } else {
      console.warn('[Tutorial] Acción custom sin handler');
      await this.next();
    }
  }

  /**
   * Avanza al siguiente paso
   */
  async next() {
    if (this.isDestroyed) return;
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      await this.runStep(this.currentIndex);
    } else {
      await this.finish();
    }
  }

  /**
   * Retrocede al paso anterior
   */
  async previous() {
    if (this.isDestroyed) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.runStep(this.currentIndex);
    }
  }

  /**
   * Va a un paso específico por ID
   */
  async goTo(stepId) {
    if (this.isDestroyed) return;
    const index = this.steps.findIndex((s) => s.id === stepId);
    if (index !== -1) {
      this.currentIndex = index;
      await this.runStep(index);
    }
  }

  /**
   * Finaliza el tutorial
   */
  async finish() {
    if (this.isDestroyed) return;
    this.isRunning = false;
    this.onComplete();
  }

  /**
   * Destruye el engine y limpia recursos
   */
  destroy() {
    this.isDestroyed = true;
    this.isRunning = false;
    this.currentStep = null;
    // Limpiar eventos
    window.dispatchEvent(new CustomEvent('tutorial:destroy'));
  }
}

export default TutorialEngine;