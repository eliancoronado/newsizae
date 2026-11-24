import React from 'react';

const ServicioNoDisponible = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative max-w-2xl w-full text-center">
        {/* Ícono */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
            <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-full p-6 shadow-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Servicio No Disponible
        </h1>

        {/* Línea decorativa */}
        <div className="flex justify-center mb-8">
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"></div>
        </div>

        {/* Párrafo de agradecimiento */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
          <p className="text-slate-300 text-lg leading-relaxed">
            Queremos agradecerte sinceramente por tu interés y por haber formado
            parte de esta experiencia. Lamentamos informarte que este servicio
            ya no se encuentra disponible, pero valoramos profundamente tu
            confianza y el tiempo que has compartido con nosotros. 
            <span className="block mt-4 text-blue-300 font-medium">
              ¡Gracias por todo! 💙
            </span>
          </p>
        </div>

        {/* Footer sutil */}
        <p className="mt-10 text-sm text-slate-500">
          ATT: Elian Coronado, CEO de SIZAE. <span className="block mt-1">© 2026 Todos los derechos reservados.</span>
        </p>
      </div>
    </div>
  );
};

export default ServicioNoDisponible;