// src/tutorial/useTutorial.js

import { useContext } from 'react';
import { TutorialContext } from './TutorialProvider';

/**
 * Hook público para consumir el tutorial desde cualquier componente
 * 
 * @returns {Object} - API del tutorial
 * @property {Function} startTutorial - Inicia un tutorial por su nombre
 * @property {Function} stopTutorial - Detiene el tutorial actual
 * @property {Function} next - Avanza al siguiente paso
 * @property {Function} previous - Retrocede al paso anterior
 * @property {Function} goTo - Va a un paso específico por ID
 * @property {boolean} running - Indica si el tutorial está en ejecución
 * @property {number} currentStep - Índice del paso actual
 * @property {number} totalSteps - Total de pasos
 * @property {Object} stepData - Datos del paso actual
 */
export const useTutorial = () => {
  const context = useContext(TutorialContext);

  if (!context) {
    throw new Error('useTutorial debe usarse dentro de un TutorialProvider');
  }

  return {
    startTutorial: context.startTutorial,
    stopTutorial: context.stopTutorial,
    next: context.next,
    previous: context.previous,
    goTo: context.goTo,
    running: context.running,
    currentStep: context.currentStep,
    totalSteps: context.totalSteps,
    stepData: context.stepData,
    isLastStep: context.isLastStep,
  };
};