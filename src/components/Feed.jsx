// components/Feed.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ref,
  push,
  onValue,
  update,
  remove,
  set,
  get,
  query,
  limitToFirst,
  startAfter,
  orderByChild,
} from "firebase/database";
import { db } from "../firebase";
import {
  deleteFromS3,
  uploadToS3,
  uploadVideoToS3,
} from "../utils/uploadToS3SDK";
import {
  FaHeart,
  FaComment,
  FaTrash,
  FaImages,
  FaTimes,
  FaPencilAlt,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Feed = ({ currentUser }) => {
  // Estados existentes
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMedia, setNewPostMedia] = useState([]); // Unificado: {type, url, file}
  const [privacy, setPrivacy] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [expandedMedia, setExpandedMedia] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [currentUploadFile, setCurrentUploadFile] = useState(null);
  const [friendsIds, setFriendsIds] = useState([]);

  // Estados para scroll infinito
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastPostTimestamp, setLastPostTimestamp] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const observerRef = useRef();
  const lastPostRef = useRef();

  // Estados para carrusel
  const [currentSlide, setCurrentSlide] = useState({});
  // Agrega este estado junto a los otros
  const [allPosts, setAllPosts] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Cargar posts iniciales (solo los primeros 5)
  useEffect(() => {
    if (!initialLoaded) {
      loadInitialPosts();
    }
  }, [friendsIds, currentUser.uid]);

  // Reemplaza loadInitialPosts con esta versión:
  // Reemplaza la función loadInitialPosts con esta versión que convierte posts antiguos:
  const loadInitialPosts = async () => {
  setLoading(true);
  try {
    const postsRef = ref(db, "posts");
    const snapshot = await get(postsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const postsList = Object.entries(data)
        .map(([id, post]) => {
          let mediaArray = post.media || [];

          if (post.images && post.images.length > 0) {
            const imageMedia = post.images.map((url) => ({
              type: "image",
              url,
            }));
            mediaArray = [...imageMedia, ...mediaArray];
          }

          if (post.videos && post.videos.length > 0) {
            const videoMedia = post.videos.map((url) => ({
              type: "video",
              url,
            }));
            mediaArray = [...mediaArray, ...videoMedia];
          }

          return {
            id,
            ...post,
            media: mediaArray,
            likes: post.likes || {},
            comments: post.comments || {},
          };
        })
        // 🔥 FILTRAR POSTS QUE CONTIENEN VIDEOS
        .filter((post) => {
          // Excluir posts que tienen videos
          const hasVideo = post.media.some(m => m.type === 'video');
          if (hasVideo) return false;
          
          if (post.privacy === "public") return true;
          if (post.privacy === "friends" && friendsIds.includes(post.userId))
            return true;
          if (post.userId === currentUser.uid) return true;
          return false;
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      const initialPosts = postsList.slice(0, 5);
      setPosts(initialPosts);
      setAllPosts(postsList);
      setHasMore(postsList.length > 5);
      setLastPostTimestamp(initialPosts[initialPosts.length - 1]?.timestamp);
    } else {
      setPosts([]);
      setHasMore(false);
    }
  } catch (error) {
    console.error("Error loading posts:", error);
  } finally {
    setLoading(false);
    setInitialLoaded(true);
  }
};

  // Reemplaza loadMorePosts con esta versión (EVITA DUPLICADOS):
  const loadMorePosts = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Simular carga para evitar duplicados
    setTimeout(() => {
      const currentCount = posts.length;
      const nextPosts = allPosts.slice(currentCount, currentCount + 5);

      if (nextPosts.length > 0) {
        // Filtrar para asegurar que no hay duplicados
        const existingIds = new Set(posts.map((p) => p.id));
        const uniqueNewPosts = nextPosts.filter(
          (post) => !existingIds.has(post.id),
        );

        setPosts((prev) => [...prev, ...uniqueNewPosts]);
        setHasMore(currentCount + 5 < allPosts.length);
      } else {
        setHasMore(false);
      }
      setLoading(false);
    }, 500);
  }, [loading, hasMore, posts.length, allPosts]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    if (!lastPostRef.current || !hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastPostRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMorePosts, posts.length]);

  // Navegación del carrusel
  const nextSlide = (postId, total) => {
    setCurrentSlide((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % total,
    }));
  };

  const prevSlide = (postId, total) => {
    setCurrentSlide((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + total) % total,
    }));
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    const isVideo = files[0]?.type.startsWith("video/");

    if (newPostMedia.length + files.length > 10) {
      alert("Máximo 10 archivos por post");
      return;
    }

    setUploading(true);
    const uploadedMedia = [];

    for (const file of files) {
      setCurrentUploadFile(file.name);
      try {
        let url;
        if (file.type.startsWith("video/")) {
          if (file.size > 50 * 1024 * 1024) {
            alert("El video no puede superar los 50MB");
            continue;
          }
          url = await uploadVideoToS3(file, (progress) => {
            setUploadProgress(progress);
          });
          uploadedMedia.push({ type: "video", url, file });
        } else if (file.type.startsWith("image/")) {
          url = await uploadToS3(file);
          uploadedMedia.push({ type: "image", url, file });
        }
      } catch (error) {
        console.error("Error subiendo:", error);
        alert(`Error al subir ${file.name}`);
      }
    }

    setNewPostMedia([...newPostMedia, ...uploadedMedia]);
    setUploading(false);
    setUploadProgress(null);
    setCurrentUploadFile(null);
  };

  const removeMedia = (index) => {
    setNewPostMedia(newPostMedia.filter((_, i) => i !== index));
  };

  const createPost = async () => {
    if (!newPostContent.trim() && newPostMedia.length === 0) return;

    const postData = {
      userId: currentUser.uid,
      userName: currentUser.name,
      userPhoto: currentUser.picture,
      content: newPostContent,
      media: newPostMedia.map((m) => ({ type: m.type, url: m.url })),
      privacy: privacy,
      timestamp: Date.now(),
      likes: {},
      comments: {},
    };

    const postsRef = ref(db, "posts");
    const newPostRef = push(postsRef);
    await set(newPostRef, postData);
    const userPostsRef = ref(
      db,
      `userPosts/${currentUser.uid}/${newPostRef.key}`,
    );
    await set(userPostsRef, true);

    // Insertar nuevo post al inicio del feed
    setPosts((prev) => [
      {
        id: newPostRef.key,
        ...postData,
      },
      ...prev,
    ]);

    setNewPostContent("");
    setNewPostMedia([]);
    setPrivacy("public");
    setShowPostForm(false);
  };

  // Componente Carrusel estilo Instagram
  // Componente Carrusel con soporte táctil
const Carousel = ({ media, postId }) => {
  const total = media.length;
  const current = currentSlide[postId] || 0;
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe izquierda - siguiente
      nextSlide(postId, total);
    }
    if (touchStart - touchEnd < -50) {
      // Swipe derecha - anterior
      prevSlide(postId, total);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  const nextSlide = (postId, total) => {
    setCurrentSlide((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % total,
    }));
  };

  const prevSlide = (postId, total) => {
    setCurrentSlide((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + total) % total,
    }));
  };

  const currentMedia = media[current];

  if (total === 1) {
    return (
      <img
        src={currentMedia.url}
        alt="post"
        className="w-full max-h-[500px] object-contain cursor-pointer"
        onClick={() => setExpandedMedia(currentMedia.url)}
      />
    );
  }

  return (
    <div 
      ref={carouselRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        <img
          src={currentMedia.url}
          alt="post"
          className="w-full max-h-[500px] object-contain cursor-pointer"
          onClick={() => setExpandedMedia(currentMedia.url)}
        />

        {/* Indicadores de posición */}
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 z-10">
          {media.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === current ? "bg-white w-6" : "bg-white/50 w-2"
              }`}
            />
          ))}
        </div>

        {/* Botones de navegación desktop */}
        {total > 1 && (
          <>
            <button
              onClick={() => prevSlide(postId, total)}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition"
            >
              <FaChevronLeft size={24} />
            </button>
            <button
              onClick={() => nextSlide(postId, total)}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition"
            >
              <FaChevronRight size={24} />
            </button>
          </>
        )}

        {/* Contador */}
        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-1 text-white text-xs">
          {current + 1}/{total}
        </div>
        
        {/* Indicador de swipe para móvil */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-xs md:hidden">
          ← Desliza →
        </div>
      </div>
    </div>
  );
};

  // Resto de funciones (toggleLike, addComment, deletePost se mantienen igual)
  const toggleLike = async (postId, currentLikes) => {
    const likesObj = currentLikes || {};
    const likesRef = ref(db, `posts/${postId}/likes/${currentUser.uid}`);
    if (likesObj[currentUser.uid]) {
      await remove(likesRef);
    } else {
      await set(likesRef, true);
    }
  };

  const addComment = async (postId) => {
    if (!commentText.trim()) return;
    const commentsRef = ref(db, `posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    await set(newCommentRef, {
      userId: currentUser.uid,
      userName: currentUser.name,
      userPhoto: currentUser.picture,
      text: commentText,
      timestamp: Date.now(),
    });
    setCommentText("");
    setShowCommentInput(null);
  };

  const deletePost = async (postId) => {
    if (window.confirm("¿Eliminar este post?")) {
      try {
        const postRef = ref(db, `posts/${postId}`);
        const postSnapshot = await get(postRef);
        const post = postSnapshot.val();

        if (post && post.media && post.media.length > 0) {
          for (const media of post.media) {
            try {
              await deleteFromS3(media.url);
            } catch (error) {
              console.error("Error al eliminar media:", media.url, error);
            }
          }
        }

        await remove(ref(db, `posts/${postId}`));
        await remove(ref(db, `userPosts/${currentUser.uid}/${postId}`));
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } catch (error) {
        console.error("Error al eliminar post:", error);
        alert("Error al eliminar el post: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Modal para media expandida */}
      {expandedMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setExpandedMedia(null)}
        >
          {expandedMedia.match(/\.(mp4|webm|ogg)$/) ? (
            <video
              src={expandedMedia}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[90vh]"
            />
          ) : (
            <img
              src={expandedMedia}
              alt="expandida"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          )}
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setExpandedMedia(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Indicador de progreso flotante */}
      {uploading && uploadProgress !== null && (
        <div className="fixed bottom-24 right-4 z-[100] bg-black/90 rounded-lg p-3 shadow-xl animate-slide-up min-w-[200px]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-gray-600">
                <div
                  className="absolute top-0 left-0 rounded-full border-t-2 border-blue-500"
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: `rotate(${uploadProgress * 3.6}deg)`,
                  }}
                />
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {uploadProgress}%
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">
                Subiendo{" "}
                {currentUploadFile?.includes("video") ? "video" : "imagen"}
              </p>
              <p className="text-gray-400 text-xs truncate max-w-[150px]">
                {currentUploadFile}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para crear post - Desktop */}
      <div className="hidden md:block bg-[#242526] rounded-xl p-4 mb-6 shadow">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="¿Qué estás pensando?"
          className="w-full bg-[#3A3B3C] text-white p-3 rounded-lg resize-none focus:outline-none"
          rows="3"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {newPostMedia.map((media, idx) => (
            <div key={idx} className="relative w-20 h-20">
              {media.type === "video" ? (
                <video
                  src={media.url}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <img
                  src={media.url}
                  alt="preview"
                  className="w-full h-full object-cover rounded"
                />
              )}
              <button
                onClick={() => removeMedia(idx)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
              >
                <FaTimes className="w-3 h-3 text-white" />
              </button>
              {media.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaPlay className="text-white text-xl opacity-75" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-2">
            <label className="bg-[#3A3B3C] p-2 rounded-full cursor-pointer">
              <FaImages className="text-[#2e9b4f]" />
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="bg-[#3A3B3C] text-white rounded-lg px-2 py-1 text-sm"
            >
              <option value="public">🌍 Público</option>
              <option value="friends">👥 Solo amigos</option>
            </select>
          </div>
          <button
            onClick={createPost}
            className="bg-[#2e9b4f] px-4 py-2 rounded-full font-semibold"
          >
            Publicar
          </button>
        </div>
      </div>

      {/* Botón flotante para móvil */}
      <button
        onClick={() => setShowPostForm(true)}
        className="md:hidden fixed bottom-24 right-4 bg-[#2e9b4f] text-white p-4 rounded-full shadow-lg hover:bg-[#268e46] transition-all z-40"
      >
        <FaPencilAlt className="text-xl" />
      </button>

      {/* Feed con scroll infinito estilo Instagram */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <div
            key={post.id}
            ref={index === posts.length - 1 ? lastPostRef : null}
            className="bg-[#242526] rounded-xl overflow-hidden shadow"
          >
            {/* Header del post */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.userPhoto}
                  alt={post.userName}
                  className="w-10 h-10 rounded-full cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/profile/${post.userId}`)
                  }
                />
                <div>
                  <p
                    className="font-semibold text-white cursor-pointer hover:underline"
                    onClick={() =>
                      (window.location.href = `/profile/${post.userId}`)
                    }
                  >
                    {post.userName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(post.timestamp, {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
              {post.userId === currentUser.uid && (
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            {/* Contenido */}
            <p className="px-4 pb-2 text-white">{post.content}</p>

            {/* Carrusel estilo Instagram */}
            {post.media?.length > 0 && (
              <Carousel media={post.media} postId={post.id} />
            )}

            {/* Botones de acción */}
            <div className="flex items-center justify-around p-2 border-t border-[#3E4042] mt-2">
              <button
                onClick={() => toggleLike(post.id, post.likes || {})}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${post.likes?.[currentUser.uid] ? "text-red-500" : "text-gray-400 hover:bg-[#3A3B3C]"}`}
              >
                <FaHeart
                  className={
                    post.likes?.[currentUser.uid] ? "fill-red-500" : ""
                  }
                />
                <span>{Object.keys(post.likes || {}).length}</span>
              </button>
              <button
                onClick={() =>
                  setShowCommentInput(
                    showCommentInput === post.id ? null : post.id,
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-[#3A3B3C]"
              >
                <FaComment />
                <span>{Object.keys(post.comments || {}).length}</span>
              </button>
            </div>

            {/* Comentarios */}
            {showCommentInput === post.id && (
              <div className="p-4 border-t border-[#3E4042]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 bg-[#3A3B3C] text-white p-2 rounded-full outline-none"
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    className="bg-[#2e9b4f] px-4 py-2 rounded-full text-sm"
                  >
                    Enviar
                  </button>
                </div>
                <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                  {post.comments &&
                    Object.entries(post.comments)
                      .sort((a, b) => b[1].timestamp - a[1].timestamp)
                      .map(([cid, comment]) => (
                        <div key={cid} className="flex gap-2">
                          <img
                            src={comment.userPhoto}
                            alt={comment.userName}
                            className="w-8 h-8 rounded-full cursor-pointer"
                            onClick={() =>
                              (window.location.href = `/profile/${comment.userId}`)
                            }
                          />
                          <div className="flex-1 bg-[#3A3B3C] rounded-lg p-2">
                            <p
                              className="font-semibold text-white text-sm cursor-pointer hover:underline"
                              onClick={() =>
                                (window.location.href = `/profile/${comment.userId}`)
                              }
                            >
                              {comment.userName}
                            </p>
                            <p className="text-gray-300 text-sm">
                              {comment.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(comment.timestamp, {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loader de carga */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-4 border-[#2e9b4f] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No hay más publicaciones
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p>No hay publicaciones aún</p>
            <p className="text-sm mt-2">Sé el primero en publicar algo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
