// src/tutorial/Tooltip.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useFloating, 
  autoUpdate, 
  offset, 
  flip, 
  shift, 
  arrow,
} from '@floating-ui/react';
import { tooltipAnimations } from './animations';

/**
 * Tooltip - Tooltip personalizado con Floating UI
 */
const Tooltip = ({
  visible = false,
  target = null,
  text = '',
  title = '',
  placement = 'bottom',
  offsetAmount = 12,
  padding = 16,
  onNext = null,
  onPrevious = null,
  onFinish = null,
  onSkip = null,
  currentStep = 0,
  totalSteps = 0,
  showCounter = true,
  showControls = true,
  showClose = true,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const arrowRef = useRef(null);
  const tooltipRef = useRef(null);

  // Configurar Floating UI
  const { x, y, strategy, refs, middlewareData } = useFloating({
    placement,
    middleware: [
      offset(offsetAmount),
      flip({ padding: 16 }),
      shift({ padding: 16 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Actualizar referencia del target
  useEffect(() => {
    if (target) {
      const element = typeof target === 'string' 
        ? document.querySelector(target) 
        : target;
      if (element) {
        refs.setReference(element);
      }
    }
  }, [target, refs]);

  // Sincronizar visibilidad
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  if (!isVisible || !text) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            zIndex: 99999,
            width: 'max-content',
            maxWidth: '320px',
            pointerEvents: 'auto',
          }}
          initial={tooltipAnimations.entrance.initial}
          animate={tooltipAnimations.entrance.animate}
          exit={tooltipAnimations.entrance.exit}
          transition={tooltipAnimations.entrance.transition}
          className="bg-white rounded-xl shadow-2xl border border-gray-200"
        >
          {/* Flecha */}
          <div
            ref={arrowRef}
            style={{
              position: 'absolute',
              backgroundColor: 'white',
              width: 12,
              height: 12,
              transform: 'rotate(45deg)',
              ...(middlewareData.arrow && {
                left: middlewareData.arrow.x != null ? `${middlewareData.arrow.x}px` : '',
                top: middlewareData.arrow.y != null ? `${middlewareData.arrow.y}px` : '',
                right: '',
                bottom: '',
              }),
            }}
            className="border border-gray-200"
          />

          {/* Contenido del tooltip */}
          <div className="p-4" style={{ padding }}>
            {/* Título */}
            {title && (
              <h3 className="font-bold text-gray-900 text-sm mb-1">
                {title}
              </h3>
            )}

            {/* Texto */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {text}
            </p>

            {/* Contador */}
            {showCounter && totalSteps > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                Paso {currentStep + 1} de {totalSteps}
              </div>
            )}

            {/* Controles */}
            {showControls && (
              <div className="mt-4 flex items-center gap-2">
                {/* Botón anterior */}
                {!isFirst && onPrevious && (
                  <button
                    onClick={onPrevious}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    ← Anterior
                  </button>
                )}

                <div className="flex-1" />

                {/* Botón siguiente / finalizar */}
                {!isLast && onNext && (
                  <button
                    onClick={onNext}
                    className="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Siguiente →
                  </button>
                )}

                {isLast && onFinish && (
                  <button
                    onClick={onFinish}
                    className="px-4 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                  >
                    🎉 Finalizar
                  </button>
                )}

                {/* Botón saltar */}
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Saltar
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Tooltip;