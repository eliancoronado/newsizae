// src/tutorial/TutorialProvider.jsx

import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { TUTORIAL_STATES } from './constants';
import TutorialEngine from './TutorialEngine';

// Contexto que se expondrá a los consumidores
export const TutorialContext = createContext(null);

// Mapa de tutoriales disponibles
const TUTORIALS_MAP = {};

/**
 * TutorialProvider - Proveedor de contexto para el sistema de tutoriales
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Componentes hijos
 * @param {Object} props.tutorials - Objeto con los tutoriales disponibles
 */
const TutorialProvider = ({ children, tutorials = {} }) => {
  // Estado principal
  const [state, setState] = useState({
    status: TUTORIAL_STATES.IDLE,
    currentStepIndex: 0,
    steps: [],
    tutorialName: null,
    stepData: null,
    running: false,
  });

  // Referencias
  const engineRef = useRef(null);
  const isStartingRef = useRef(false);

  // Registrar tutoriales
  useEffect(() => {
    Object.assign(TUTORIALS_MAP, tutorials);
  }, [tutorials]);

  /**
   * Inicia un tutorial por su nombre
   * @param {string} name - Nombre del tutorial
   * @returns {Promise}
   */
  const startTutorial = useCallback(async (name) => {
    if (isStartingRef.current) {
      console.warn('[Tutorial] Ya se está iniciando un tutorial');
      return;
    }

    const tutorialSteps = TUTORIALS_MAP[name];
    if (!tutorialSteps) {
      console.error(`[Tutorial] Tutorial "${name}" no encontrado`);
      return;
    }

    isStartingRef.current = true;

    // Limpiar engine anterior si existe
    if (engineRef.current) {
      engineRef.current.destroy();
    }

    // Crear nuevo engine
    const engine = new TutorialEngine({
      steps: tutorialSteps,
      onStepChange: (step, index) => {
        setState((prev) => ({
          ...prev,
          currentStepIndex: index,
          stepData: step,
        }));
      },
      onComplete: () => {
        setState((prev) => ({
          ...prev,
          status: TUTORIAL_STATES.COMPLETED,
          running: false,
        }));
        isStartingRef.current = false;
        // Emitir evento
        window.dispatchEvent(new CustomEvent('tutorial:complete', {
          detail: { tutorial: name },
        }));
      },
      onSkip: () => {
        setState((prev) => ({
          ...prev,
          status: TUTORIAL_STATES.SKIPPED,
          running: false,
        }));
        isStartingRef.current = false;
        window.dispatchEvent(new CustomEvent('tutorial:skip', {
          detail: { tutorial: name },
        }));
      },
    });

    engineRef.current = engine;

    // Actualizar estado
    setState({
      status: TUTORIAL_STATES.MOVING,
      currentStepIndex: 0,
      steps: tutorialSteps,
      tutorialName: name,
      stepData: tutorialSteps[0] || null,
      running: true,
    });

    // Emitir evento de inicio
    window.dispatchEvent(new CustomEvent('tutorial:start', {
      detail: { tutorial: name, totalSteps: tutorialSteps.length },
    }));

    try {
      // Iniciar el engine
      await engine.start();
    } catch (error) {
      console.error('[Tutorial] Error en el engine:', error);
      isStartingRef.current = false;
      setState((prev) => ({ ...prev, running: false }));
    }

    isStartingRef.current = false;
  }, []);

  /**
   * Detiene el tutorial actual
   */
  const stopTutorial = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
    }
    setState({
      status: TUTORIAL_STATES.IDLE,
      currentStepIndex: 0,
      steps: [],
      tutorialName: null,
      stepData: null,
      running: false,
    });
    isStartingRef.current = false;
    window.dispatchEvent(new CustomEvent('tutorial:end'));
  }, []);

  /**
   * Avanza al siguiente paso
   */
  const next = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.next();
    }
  }, []);

  /**
   * Retrocede al paso anterior
   */
  const previous = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.previous();
    }
  }, []);

  /**
   * Va a un paso específico por ID
   */
  const goTo = useCallback((stepId) => {
    if (engineRef.current) {
      engineRef.current.goTo(stepId);
    }
  }, []);

  // Valor del contexto
  const value = {
    startTutorial,
    stopTutorial,
    next,
    previous,
    goTo,
    running: state.running,
    currentStep: state.currentStepIndex,
    totalSteps: state.steps.length,
    stepData: state.stepData,
    isLastStep: state.currentStepIndex === state.steps.length - 1,
    status: state.status,
    tutorialName: state.tutorialName,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialProvider;