// components/StoriesViewer.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaHeart,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  getUserStories,
  markStoryViewed,
  toggleStoryLike,
  getUserInfo,
} from "../utils/stories";

export default function StoriesViewer({
  userId,
  userName,
  userPhoto,
  currentUserId,
  onClose,
}) {
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewersList, setViewersList] = useState([]); // { userId, name, photo, viewedAt, liked }
  const [showViewers, setShowViewers] = useState(false);
  const [liked, setLiked] = useState(false);
  const progressInterval = useRef(null);
  const storyTimeout = useRef(null);
  const hasMarkedViewed = useRef(false);

  // Definir nextStory y prevStory con useCallback
  const nextStory = useCallback(() => {
    if (currentIndex + 1 < stories.length) {
      setCurrentIndex((prev) => prev + 1);
      hasMarkedViewed.current = false;
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const prevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      hasMarkedViewed.current = false;
    }
  }, [currentIndex]);

  // Cargar historias del usuario
  useEffect(() => {
    const unsubscribe = getUserStories(userId, (activeStories) => {
      setStories(activeStories);
      if (activeStories.length === 0) {
        onClose();
      }
    });
    return () => unsubscribe();
  }, [userId, onClose]);

  // Actualizar estado del like para la historia actual
  useEffect(() => {
    if (!stories.length || currentIndex >= stories.length) return;
    const story = stories[currentIndex];
    setLiked(!!story.likes?.[currentUserId]);
  }, [stories, currentIndex, currentUserId]);

  // Obtener lista de viewers con información detallada
  useEffect(() => {
    if (!stories.length || currentIndex >= stories.length) return;
    const story = stories[currentIndex];
    const viewers = story.viewers || {};
    const likes = story.likes || {};
    const viewersIds = Object.keys(viewers);

    const fetchViewersInfo = async () => {
      const viewersInfo = await Promise.all(
        viewersIds.map(async (uid) => {
          const info = await getUserInfo(uid);
          return {
            userId: uid,
            name: info.name || "Usuario",
            photo: info.photo,
            viewedAt: viewers[uid],
            liked: !!likes[uid],
          };
        }),
      );
      // Ordenar por fecha de visualización (más reciente primero)
      viewersInfo.sort((a, b) => b.viewedAt - a.viewedAt);
      setViewersList(viewersInfo);
    };

    fetchViewersInfo();
  }, [stories, currentIndex]);

  // Marcar vista (solo una vez por historia)
  useEffect(() => {
    if (!stories.length || currentIndex >= stories.length) return;
    if (hasMarkedViewed.current) return;
    const story = stories[currentIndex];
    if (!story.viewers?.[currentUserId]) {
      hasMarkedViewed.current = true;
      markStoryViewed(userId, story.id, currentUserId).catch(console.error);
    }
  }, [currentIndex, stories, userId, currentUserId]);

  // Temporizador para avanzar automáticamente
  useEffect(() => {
    if (!stories.length || currentIndex >= stories.length) return;
    const story = stories[currentIndex];
    const progressBar = document.getElementById(`progress-${story.id}`);

    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    if (progressInterval.current) clearInterval(progressInterval.current);

    if (progressBar) progressBar.style.width = "0%";

    storyTimeout.current = setTimeout(() => {
      nextStory();
    }, 10000);

    let startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / 10000) * 100, 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (percent >= 100) clearInterval(progressInterval.current);
    }, 50);

    return () => {
      // No limpiamos aquí para evitar reinicios
    };
  }, [currentIndex, stories.length, nextStory]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (storyTimeout.current) clearTimeout(storyTimeout.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Manejar like
  const handleLike = async () => {
    const story = stories[currentIndex];
    await toggleStoryLike(userId, story.id, currentUserId);
    // Actualizar estado local
    setLiked(!liked);
    // También actualizar el objeto stories para reflejar el cambio
    setStories((prevStories) => {
      const newStories = [...prevStories];
      const storyToUpdate = newStories[currentIndex];
      if (liked) {
        delete storyToUpdate.likes[currentUserId];
        if (Object.keys(storyToUpdate.likes).length === 0) {
          delete storyToUpdate.likes;
        }
      } else {
        if (!storyToUpdate.likes) storyToUpdate.likes = {};
        storyToUpdate.likes[currentUserId] = Date.now();
      }
      return newStories;
    });
  };

  // Navegación manual
  const handleManualNext = useCallback(() => {
    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    nextStory();
  }, [nextStory]);

  const handleManualPrev = useCallback(() => {
    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    prevStory();
  }, [prevStory]);

  // Pausa al hover
  const handleMouseEnter = useCallback(() => {
    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!stories.length || currentIndex >= stories.length) return;
    const story = stories[currentIndex];
    const progressBar = document.getElementById(`progress-${story.id}`);
    const currentWidth = progressBar
      ? parseFloat(progressBar.style.width) || 0
      : 0;
    const remainingPercent = 100 - currentWidth;
    const remainingTime = (remainingPercent / 100) * 10000;

    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    if (progressInterval.current) clearInterval(progressInterval.current);

    storyTimeout.current = setTimeout(() => {
      nextStory();
    }, remainingTime);

    let startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newPercent =
        currentWidth + (elapsed / remainingTime) * remainingPercent;
      const percent = Math.min(newPercent, 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (percent >= 100) clearInterval(progressInterval.current);
    }, 50);
  }, [stories, currentIndex, nextStory]);

  if (!stories.length) return null;
  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón cerrar */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="text-white text-2xl hover:opacity-80 transition"
        >
          <FaTimes />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((story, idx) => (
          <div
            key={story.id}
            className="flex-1 h-1 bg-gray-600 rounded overflow-hidden"
          >
            <div
              id={`progress-${story.id}`}
              className="h-full bg-white rounded transition-all duration-100 ease-linear"
              style={{
                width:
                  idx < currentIndex
                    ? "100%"
                    : idx === currentIndex
                      ? "0%"
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Contenido de la historia */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50"
            style={{ backgroundImage: `url(${currentStory.imageUrl})` }}
          />
        )}
        {currentStory.imageUrl && (
          <img
            src={currentStory.imageUrl}
            alt="story"
            className="max-w-full max-h-full object-contain z-10"
          />
        )}
        {currentStory.text && (
          <div className="absolute bottom-20 left-0 right-0 p-4 bg-black/50 text-white text-center z-20">
            <p className="text-lg">{currentStory.text}</p>
          </div>
        )}

        {/* Botón like */}
        <button
          onClick={handleLike}
          className="absolute bottom-4 left-4 bg-black/50 p-3 rounded-full text-white hover:bg-black/70 transition z-20"
        >
          <FaHeart
            className={liked ? "text-red-500 fill-red-500" : ""}
            size={24}
          />
        </button>

        {/* Controles de navegación */}
        {stories.length > 1 && (
          <>
            <button
              onClick={handleManualPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 p-3 rounded-full text-white hover:bg-black/70 transition z-20"
            >
              <FaChevronLeft size={24} />
            </button>
            <button
              onClick={handleManualNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 p-3 rounded-full text-white hover:bg-black/70 transition z-20"
            >
              <FaChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Información del usuario */}
      <div className="absolute top-4 left-16 flex items-center gap-2 text-white z-20 bg-black/50 px-3 py-2 rounded-full">
        <img src={userPhoto} alt={userName} className="w-8 h-8 rounded-full" />
        <span className="font-semibold">{userName}</span>
        <span className="text-xs text-gray-300">
          {formatDistanceToNow(currentStory.createdAt, {
            addSuffix: true,
            locale: es,
          })}
        </span>
      </div>

      {/* Botón de vistas (solo dueño) */}
      {userId === currentUserId && (
        <button
          onClick={() => setShowViewers(!showViewers)}
          className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition z-20"
        >
          <FaEye />
        </button>
      )}

      {/* Panel de vistas con información detallada */}
      {showViewers && (
        <div className="absolute bottom-16 right-4 bg-black/80 text-white p-3 rounded-lg max-w-xs max-h-64 overflow-auto z-30">
          <h4 className="font-semibold mb-2">Visto por:</h4>
          {viewersList.length === 0 ? (
            <p className="text-sm">Nadie aún</p>
          ) : (
            viewersList.map((viewer) => {
              // Validar que viewer.viewedAt sea un número válido (timestamp)
              const isValidTimestamp =
                typeof viewer.viewedAt === "number" && !isNaN(viewer.viewedAt);
              const viewedDate = isValidTimestamp
                ? new Date(viewer.viewedAt)
                : null;

              // ✅ RETORNAR el JSX correctamente
              return (
                <div
                  key={viewer.userId}
                  className="flex items-center gap-2 py-2 border-b border-gray-600 last:border-0"
                >
                  <img
                    src={viewer.photo || "https://via.placeholder.com/32"}
                    alt={viewer.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{viewer.name}</p>
                    <p className="text-xs text-gray-400">
                      {!isValidTimestamp ? (
                        "Visto recientemente"
                      ) : (
                        <>
                          Visto{" "}
                          {formatDistanceToNow(viewedDate, {
                            addSuffix: true,
                            locale: es,
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  {viewer.liked && (
                    <FaHeart className="text-red-500 fill-red-500 text-xs" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
