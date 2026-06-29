// components/TutorialSystem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GiClick, GiMousePointer, GiHand, GiPointing } from 'react-icons/gi';
import { MdArrowForward, MdArrowBack, MdClose } from 'react-icons/md';
import { FaHandPointer, FaMousePointer } from 'react-icons/fa';
import { HiOutlineHand } from 'react-icons/hi';

// Configuración de los pasos del tutorial para el LeftPanel
const TUTORIAL_STEPS = [
  {
    id: 'drag-element',
    title: '🚀 Arrastra tu primer elemento',
    description: 'Comienza arrastrando un elemento desde el LeftPanel hacia el área central.',
    targetSelector: '.left-panel .element-item:first-child',
    icon: 'hand',
    position: 'right',
    action: 'drag',
    hint: 'Haz clic y arrastra este elemento',
  },
  {
    id: 'drop-element',
    title: '📦 Suelta el elemento',
    description: 'Suelta el elemento en el área central para colocarlo en tu diseño.',
    targetSelector: '.central-panel',
    icon: 'pointer',
    position: 'bottom',
    action: 'drop',
    hint: 'Suelta aquí para agregar el elemento',
  },
  {
    id: 'select-element',
    title: '🎯 Selecciona el elemento',
    description: 'Haz clic en el elemento que acabas de agregar para seleccionarlo.',
    targetSelector: '.central-panel .dropped-element',
    icon: 'pointer',
    position: 'top',
    action: 'click',
    hint: 'Haz clic para seleccionar',
  },
  {
    id: 'edit-properties',
    title: '✏️ Edita las propiedades',
    description: 'Modifica las propiedades del elemento en el RightPanel.',
    targetSelector: '.right-panel .property-group:first-child',
    icon: 'pointer',
    position: 'left',
    action: 'click',
    hint: 'Cambia las propiedades aquí',
  },
  {
    id: 'add-styles',
    title: '🎨 Agrega estilos globales',
    description: 'Ve a la sección de estilos globales para personalizar tu proyecto.',
    targetSelector: '.sidebar .gstyles-icon',
    icon: 'pointer',
    position: 'right',
    action: 'click',
    hint: 'Haz clic para abrir estilos globales',
  },
  {
    id: 'preview-project',
    title: '👁️ Previsualiza tu proyecto',
    description: 'Haz clic en "Preview" para ver cómo queda tu diseño.',
    targetSelector: '.central-panel .preview-button',
    icon: 'pointer',
    position: 'bottom',
    action: 'click',
    hint: 'Haz clic para previsualizar',
  },
  {
    id: 'save-project',
    title: '💾 Guarda tu proyecto',
    description: 'Guarda tu proyecto para no perder tu progreso.',
    targetSelector: '.central-panel .save-button',
    icon: 'pointer',
    position: 'top',
    action: 'click',
    hint: 'Haz clic para guardar',
  },
  {
    id: 'complete',
    title: '🎉 ¡Tutorial completado!',
    description: 'Has aprendido lo básico. ¡Ahora crea proyectos increíbles!',
    targetSelector: null,
    icon: 'complete',
    position: 'center',
    action: 'complete',
    hint: '¡Excelente trabajo!',
  },
];

// Componente de indicador animado (dedo/mouse)
const FINGER_ICONS = {
  hand: GiHand,
  pointer: FaMousePointer,
  click: GiClick,
  drag: GiPointing,
};

const TutorialFinger = ({ type = 'hand', action = 'click', isDragging = false }) => {
  const Icon = FINGER_ICONS[type] || GiHand;
  
  return (
    <motion.div
      className="relative"
      animate={{
        scale: isDragging ? [1, 1.2, 1] : [1, 1.1, 1],
        x: isDragging ? [0, 10, 0] : 0,
        y: isDragging ? [0, -5, 0] : 0,
      }}
      transition={{
        duration: isDragging ? 0.8 : 1.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Icon 
        className="text-4xl text-yellow-400 drop-shadow-glow" 
        style={{ 
          filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))',
          transform: action === 'drag' ? 'rotate(-30deg)' : 'rotate(0deg)'
        }}
      />
      {action === 'click' && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
          animate={{
            scale: [1, 2, 1],
            opacity: [1, 0, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      {action === 'drag' && (
        <motion.div
          className="absolute -bottom-4 left-1/2 w-8 h-8 border-2 border-yellow-400 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.2, 0.8],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
};

// Componente principal del Tutorial
const TutorialSystem = ({ 
  isActive = true, 
  onComplete, 
  steps = TUTORIAL_STEPS,
  targetRef 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [targetPosition, setTargetPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const stepRef = useRef(null);
  const intervalRef = useRef(null);

  // Buscar el elemento objetivo
  const findTargetElement = (selector) => {
    if (!selector) return null;
    try {
      return document.querySelector(selector);
    } catch (e) {
      console.warn('Selector no válido:', selector);
      return null;
    }
  };

  // Calcular posición del objetivo
  const updateTargetPosition = () => {
    const step = steps[currentStep];
    if (!step || !step.targetSelector) {
      setTargetPosition({ x: '50%', y: '50%' });
      return;
    }

    const element = findTargetElement(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const position = step.position || 'bottom';
      
      let x, y;
      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - 20;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + 20;
          break;
        case 'left':
          x = rect.left - 20;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 20;
          y = rect.top + rect.height / 2;
          break;
        default:
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
      }
      
      setTargetPosition({ x, y });
    } else {
      // Si no encuentra el elemento, centrar
      setTargetPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  };

  // Efecto para actualizar posición
  useEffect(() => {
    if (!showTutorial || !isActive) return;

    updateTargetPosition();

    // Actualizar posición en resize/scroll
    const handleUpdate = () => updateTargetPosition();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);

    // Intervalo para verificar si el elemento existe
    intervalRef.current = setInterval(updateTargetPosition, 500);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentStep, showTutorial, isActive]);

  // Detectores de acciones del usuario
  useEffect(() => {
    if (!showTutorial || !isActive) return;

    const step = steps[currentStep];
    if (!step) return;

    // Detectar drag
    const handleDragStart = (e) => {
      setIsDragging(true);
      if (step.action === 'drag') {
        // Avanzar al siguiente paso cuando empieza a arrastrar
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
          }
        }, 500);
      }
    };

    // Detectar drop
    const handleDrop = (e) => {
      setIsDragging(false);
      if (step.action === 'drop' && step.targetSelector) {
        const target = findTargetElement(step.targetSelector);
        if (target && target.contains(e.target)) {
          setTimeout(() => {
            if (currentStep < steps.length - 1) {
              setCurrentStep(currentStep + 1);
            }
          }, 500);
        }
      }
    };

    // Detectar click
    const handleClick = (e) => {
      if (step.action === 'click' && step.targetSelector) {
        const target = findTargetElement(step.targetSelector);
        if (target && (target === e.target || target.contains(e.target))) {
          setTimeout(() => {
            if (currentStep < steps.length - 1) {
              setCurrentStep(currentStep + 1);
            }
          }, 500);
        }
      }
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('click', handleClick);
    };
  }, [currentStep, showTutorial, isActive, steps]);

  // Saltar tutorial
  const skipTutorial = () => {
    setShowTutorial(false);
    if (onComplete) onComplete();
  };

  // Ir al siguiente paso
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowTutorial(false);
      if (onComplete) onComplete();
    }
  };

  // Paso anterior
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!showTutorial || !isActive) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const isComplete = step.id === 'complete';

  return (
    <>
      {/* Overlay oscuro con efecto spotlight */}
      {!isComplete && targetPosition && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <div className="w-full h-full relative">
            {/* Fondo oscuro */}
            <div className="absolute inset-0 bg-black/60" />
            {/* Spotlight circular */}
            <div 
              className="absolute rounded-full bg-transparent"
              style={{
                left: targetPosition.x - 150,
                top: targetPosition.y - 150,
                width: 300,
                height: 300,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                border: '3px solid rgba(255, 215, 0, 0.5)',
                animation: 'pulse-border 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Indicador de dedo/mouse */}
      {!isComplete && targetPosition && step.action !== 'complete' && (
        <motion.div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: targetPosition.x - 20,
            top: targetPosition.y - 40,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <TutorialFinger 
            type={step.icon || 'hand'} 
            action={step.action}
            isDragging={isDragging}
          />
        </motion.div>
      )}

      {/* Tooltip de información */}
      <AnimatePresence>
        {!isComplete && (
          <motion.div
            className="fixed z-[9999] bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md border border-yellow-400/30 shadow-2xl"
            style={{
              left: targetPosition ? targetPosition.x + 40 : '50%',
              top: targetPosition ? targetPosition.y - 60 : '50%',
              transform: targetPosition ? 'none' : 'translate(-50%, -50%)',
              maxWidth: '380px',
            }}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Línea conectora */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-yellow-400/50" />

            {/* Contenido */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">{step.title.split(' ')[0]}</span>
                  {step.title.split(' ').slice(1).join(' ')}
                </h3>
                <button
                  onClick={skipTutorial}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <MdClose size={20} />
                </button>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Hint con acción */}
              <div className="flex items-center gap-2 mt-2 bg-yellow-400/10 rounded-lg p-2 border border-yellow-400/20">
                <div className="text-yellow-400">
                  <FaMousePointer size={16} />
                </div>
                <span className="text-yellow-300 text-xs font-medium">
                  {step.hint}
                </span>
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep 
                          ? 'w-6 bg-yellow-400' 
                          : i < currentStep
                          ? 'w-3 bg-yellow-400/30'
                          : 'w-3 bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                      Anterior
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    className="px-4 py-1.5 bg-yellow-400 text-black text-xs font-medium rounded-lg hover:bg-yellow-300 transition-colors flex items-center gap-1"
                  >
                    {currentStep < steps.length - 1 ? (
                      <>
                        Siguiente <MdArrowForward size={14} />
                      </>
                    ) : (
                      'Finalizar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pantalla de completado */}
      {isComplete && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 max-w-lg text-center border border-yellow-400/30"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-3">
              ¡Tutorial completado!
            </h2>
            <p className="text-gray-300 text-base mb-6 leading-relaxed">
              Has aprendido lo básico para usar Baboo Engine. 
              Ahora puedes crear proyectos increíbles.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={skipTutorial}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-400/30 transition-all"
              >
                🚀 ¡Empezar a crear!
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setShowTutorial(false);
                  if (onComplete) onComplete();
                }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Ver tutorial nuevamente
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Estilos adicionales */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(255, 215, 0, 0.5); box-shadow: 0 0 0 9999px rgba(0,0,0,0.6), 0 0 40px rgba(255, 215, 0, 0.1); }
          50% { border-color: rgba(255, 215, 0, 0.8); box-shadow: 0 0 0 9999px rgba(0,0,0,0.6), 0 0 60px rgba(255, 215, 0, 0.2); }
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
        }
      `}</style>
    </>
  );
};

export default TutorialSystem;