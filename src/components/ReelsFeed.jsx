import React from 'react'

const ReelsFeed = ({currentUser}) => {
  return (
    <div className='h-full bg-[#18191A] rounded-xl overflow-hidden shadow-xl flex items-center justify-center text-gray-400 text-lg font-medium'>
      {currentUser ? "Aquí iría el feed de Reels (Proyectos)" : "Inicia sesión para ver los Reels"}
    </div>
  )
}

export default ReelsFeed
