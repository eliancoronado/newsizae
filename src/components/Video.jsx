// components/Video.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ref,
  onValue,
  update,
  remove,
  set,
  get,
  push,
} from "firebase/database";
import { db } from "../firebase";
import {
  FaHeart,
  FaComment,
  FaShare,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaUserPlus,
  FaCheck,
  FaUserCheck,
  FaClock,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Video = ({ currentUser }) => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [friendsIds, setFriendsIds] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [friendStatuses, setFriendStatuses] = useState({});
  const [pendingRequests, setPendingRequests] = useState({});

  // Refs para videos
  const videoRefs = useRef({});
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  // Cargar amigos y solicitudes
  useEffect(() => {
    const fetchFriendsAndRequests = async () => {
      // Obtener amigos
      const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
      const friendsSnapshot = await get(friendsRef);
      const friendsObj = friendsSnapshot.val() || {};
      setFriendsIds(Object.keys(friendsObj));

      // Obtener solicitudes enviadas (pendientes)
      const sentRequestsRef = ref(db, `users/${currentUser.uid}/sentRequests`);
      const sentSnapshot = await get(sentRequestsRef);
      const sentObj = sentSnapshot.val() || {};
      setPendingRequests(sentObj);
    };
    fetchFriendsAndRequests();
  }, [currentUser.uid]);

  // Escuchar comentarios en tiempo real para todos los videos
  useEffect(() => {
    if (videos.length === 0) return;

    const unsubscribes = videos.map((video) => {
      const commentsRef = ref(db, `posts/${video.id}/comments`);
      return onValue(commentsRef, (snapshot) => {
        const data = snapshot.val();
        const count = data ? Object.keys(data).length : 0;
        setCommentCounts((prev) => ({ ...prev, [video.id]: count }));
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [videos]);

  // Verificar estado de amistad para cada usuario de video
  useEffect(() => {
    const checkFriendStatuses = async () => {
      const statuses = {};
      for (const video of videos) {
        const userId = video.userId;
        if (userId === currentUser.uid) {
          statuses[userId] = "self";
          continue;
        }

        // Verificar si es amigo
        if (friendsIds.includes(userId)) {
          statuses[userId] = "friend";
          continue;
        }

        // Verificar si hay solicitud enviada pendiente
        if (pendingRequests[userId]) {
          statuses[userId] = "pending";
          continue;
        }

        // Verificar si hay solicitud recibida
        const receivedRequestsRef = ref(
          db,
          `users/${currentUser.uid}/receivedRequests/${userId}`,
        );
        const receivedSnapshot = await get(receivedRequestsRef);
        if (receivedSnapshot.exists()) {
          statuses[userId] = "received";
          continue;
        }

        statuses[userId] = "none";
      }
      setFriendStatuses(statuses);
    };

    if (videos.length > 0) {
      checkFriendStatuses();
    }
  }, [videos, friendsIds, pendingRequests, currentUser.uid]);

  // Cargar solo posts que contienen videos
  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const videosList = Object.entries(data)
          .map(([id, post]) => {
            let videoMedia = [];

            if (post.media && post.media.length > 0) {
              videoMedia = post.media.filter((m) => m.type === "video");
            }

            if (post.videos && post.videos.length > 0) {
              videoMedia = [
                ...videoMedia,
                ...post.videos.map((url) => ({ type: "video", url })),
              ];
            }

            if (videoMedia.length === 0) return null;

            return {
              id,
              ...post,
              video: videoMedia[0],
              likes: post.likes || {},
              comments: post.comments || {},
            };
          })
          .filter((post) => post !== null)
          .filter((post) => {
            if (post.privacy === "public") return true;
            if (post.privacy === "friends" && friendsIds.includes(post.userId))
              return true;
            if (post.userId === currentUser.uid) return true;
            return false;
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        setVideos(videosList);
        setLoading(false);
      } else {
        setVideos([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [friendsIds, currentUser.uid]);

  // Observer para scroll tipo TikTok
  useEffect(() => {
    if (!containerRef.current || videos.length === 0) return;

    const options = {
      root: containerRef.current,
      threshold: 0.6,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoId = entry.target.getAttribute("data-video-id");
        const videoIndex = parseInt(videoId);
        const video = videoRefs.current[videoIndex];

        if (entry.isIntersecting) {
          setCurrentIndex(videoIndex);
          if (video) {
            video.currentTime = 0;
            video.play().catch((e) => console.log("Error playing:", e));
          }
        } else {
          if (video) {
            video.pause();
          }
        }
      });
    }, options);

    const videoElements = document.querySelectorAll(".video-item");
    videoElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos]);

  // Control de video
  const togglePlay = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = (index, e) => {
    e.stopPropagation();
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
    }
  };

  const toggleLike = async (postId, currentLikes) => {
    const likesObj = currentLikes || {};
    const likesRef = ref(db, `posts/${postId}/likes/${currentUser.uid}`);
    if (likesObj[currentUser.uid]) {
      await remove(likesRef);
    } else {
      await set(likesRef, true);
    }
  };

  // Enviar solicitud de amistad
  const sendFriendRequest = async (toUserId, userName) => {
    try {
      // Crear solicitud en receivedRequests del destinatario
      await set(
        ref(db, `users/${toUserId}/receivedRequests/${currentUser.uid}`),
        {
          from_uid: currentUser.uid,
          from_name: currentUser.name,
          from_photo: currentUser.picture,
          timestamp: Date.now(),
          status: "pending",
        },
      );

      // Crear solicitud en sentRequests del remitente
      await set(ref(db, `users/${currentUser.uid}/sentRequests/${toUserId}`), {
        to_uid: toUserId,
        to_name: userName,
        timestamp: Date.now(),
        status: "pending",
      });

      // Actualizar estado local
      setPendingRequests((prev) => ({ ...prev, [toUserId]: true }));
      setFriendStatuses((prev) => ({ ...prev, [toUserId]: "pending" }));

      console.log("Solicitud enviada a:", userName);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  // Aceptar solicitud de amistad
  const acceptFriendRequest = async (fromUserId, userName, userPhoto) => {
    try {
      // Agregar a amigos mutuamente
      await set(ref(db, `users/${currentUser.uid}/friends/${fromUserId}`), {
        uid: fromUserId,
        name: userName,
        photo: userPhoto,
        timestamp: Date.now(),
      });

      await set(ref(db, `users/${fromUserId}/friends/${currentUser.uid}`), {
        uid: currentUser.uid,
        name: currentUser.name,
        photo: currentUser.picture,
        timestamp: Date.now(),
      });

      // Eliminar solicitudes pendientes
      await remove(
        ref(db, `users/${currentUser.uid}/receivedRequests/${fromUserId}`),
      );
      await remove(
        ref(db, `users/${fromUserId}/sentRequests/${currentUser.uid}`),
      );

      // Crear chat
      const chatId = [currentUser.uid, fromUserId].sort().join("_");
      await set(ref(db, `userChats/${currentUser.uid}/${fromUserId}`), {
        chatId: chatId,
        lastMessage: "",
        lastMessageTime: Date.now(),
        userName: userName,
        userPhoto: userPhoto,
        unreadCount: 0,
      });

      await set(ref(db, `userChats/${fromUserId}/${currentUser.uid}`), {
        chatId: chatId,
        lastMessage: "",
        lastMessageTime: Date.now(),
        userName: currentUser.name,
        userPhoto: currentUser.picture,
        unreadCount: 0,
      });

      // Actualizar estados locales
      setFriendsIds((prev) => [...prev, fromUserId]);
      setFriendStatuses((prev) => ({ ...prev, [fromUserId]: "friend" }));
      setPendingRequests((prev) => {
        const newState = { ...prev };
        delete newState[fromUserId];
        return newState;
      });

      console.log("Amistad aceptada con:", userName);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  // Cancelar solicitud enviada
  const cancelFriendRequest = async (toUserId) => {
    try {
      await remove(
        ref(db, `users/${currentUser.uid}/sentRequests/${toUserId}`),
      );
      await remove(
        ref(db, `users/${toUserId}/receivedRequests/${currentUser.uid}`),
      );

      setPendingRequests((prev) => {
        const newState = { ...prev };
        delete newState[toUserId];
        return newState;
      });
      setFriendStatuses((prev) => ({ ...prev, [toUserId]: "none" }));
    } catch (error) {
      console.error("Error canceling friend request:", error);
    }
  };

  // Rechazar solicitud recibida
  const rejectFriendRequest = async (fromUserId) => {
    try {
      await remove(
        ref(db, `users/${currentUser.uid}/receivedRequests/${fromUserId}`),
      );
      await remove(
        ref(db, `users/${fromUserId}/sentRequests/${currentUser.uid}`),
      );

      setFriendStatuses((prev) => ({ ...prev, [fromUserId]: "none" }));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  // Renderizar botón de amistad según el estado
  const renderFriendButton = (userId, userName, userPhoto) => {
    const status = friendStatuses[userId];

    if (userId === currentUser.uid) return null;

    switch (status) {
      case "friend":
        return (
          <button className="ml-2 bg-[#4E4F50] px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <FaUserCheck className="inline" />
            Amigo
          </button>
        );
      case "pending":
        return (
          <button
            onClick={() => cancelFriendRequest(userId)}
            className="ml-2 bg-[#4E4F50] px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-red-500/80 transition"
          >
            <FaClock className="inline" />
            Cancelar
          </button>
        );
      case "received":
        return (
          <div className="ml-2 flex gap-2">
            <button
              onClick={() => acceptFriendRequest(userId, userName, userPhoto)}
              className="bg-[#2e9b4f] px-3 py-1 rounded-full text-sm font-semibold hover:bg-[#268e46] transition"
            >
              Aceptar
            </button>
            <button
              onClick={() => rejectFriendRequest(userId)}
              className="bg-[#4E4F50] px-3 py-1 rounded-full text-sm font-semibold hover:bg-[#5E5F60] transition"
            >
              Rechazar
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={() => sendFriendRequest(userId, userName)}
            className="ml-2 bg-[#2e9b4f] px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-[#268e46] transition"
          >
            <FaUserPlus className="inline" />
            Seguir
          </button>
        );
    }
  };

  // Modal de comentarios
  const CommentsModal = ({ post, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
      const commentsRef = ref(db, `posts/${post.id}/comments`);
      const unsubscribe = onValue(commentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const commentsList = Object.entries(data)
            .map(([id, comment]) => ({ id, ...comment }))
            .sort((a, b) => b.timestamp - a.timestamp);
          setComments(commentsList);
        } else {
          setComments([]);
        }
      });
      return () => unsubscribe();
    }, [post.id]);

    const handleAddComment = async () => {
      if (!newComment.trim()) return;
      const commentsRef = ref(db, `posts/${post.id}/comments`);
      const newCommentRef = push(commentsRef);
      await set(newCommentRef, {
        userId: currentUser.uid,
        userName: currentUser.name,
        userPhoto: currentUser.picture,
        text: newComment,
        timestamp: Date.now(),
      });
      setNewComment("");
    };

    return (
      <div
        className="fixed inset-0 bottom-[70px] z-50 bg-black/90"
        onClick={onClose}
      >
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-3xl max-h-[80vh] overflow-y-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-[#1a1a1a] p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <img
                src={post.userPhoto}
                alt={post.userName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold text-white">{post.userName}</p>
                <p className="text-xs text-gray-400">{post.content}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No hay comentarios aún</p>
                <p className="text-sm mt-1">Sé el primero en comentar</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.userPhoto}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">
                      {comment.userName}
                    </p>
                    <p className="text-gray-300 text-sm">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(comment.timestamp, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sticky bottom-0 bg-[#1a1a1a] p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añadir comentario..."
                className="flex-1 bg-[#2a2a2a] text-white p-3 rounded-full outline-none"
              />
              <button
                onClick={handleAddComment}
                className="bg-[#2e9b4f] px-6 rounded-full font-semibold"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-[#2e9b4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-2">🎬 No hay videos aún</p>
          <p className="text-gray-400">Sé el primero en subir un video</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          data-video-id={index}
          className="video-item relative h-screen snap-start snap-always flex items-center justify-center"
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={video.video.url}
            className="w-full h-full object-contain"
            loop
            muted={index !== currentIndex}
            playsInline
            onClick={() => togglePlay(index)}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

          {/* Info del usuario y descripción */}
          <div className="absolute bottom-24 left-4 right-20 text-white pointer-events-auto">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={video.userPhoto}
                alt=""
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <p className="font-semibold text-base">@{video.userName}</p>
              {renderFriendButton(
                video.userId,
                video.userName,
                video.userPhoto,
              )}
            </div>
            <p className="text-sm">{video.content}</p>
            <p className="text-xs text-gray-300 mt-1">
              {formatDistanceToNow(video.timestamp, {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="absolute bottom-24 right-4 flex flex-col gap-6 items-center pointer-events-auto">
            <div className="flex flex-col items-center">
              <img
                src={video.userPhoto}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            </div>

            <button
              onClick={() => toggleLike(video.id, video.likes)}
              className="flex flex-col items-center"
            >
              <div className="bg-black/40 rounded-full p-3">
                <FaHeart
                  className={`text-3xl ${video.likes?.[currentUser.uid] ? "text-red-500 fill-red-500" : "text-white"}`}
                />
              </div>
              <span className="text-white text-xs mt-1">
                {Object.keys(video.likes || {}).length}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedPost(video);
                setShowComments(true);
              }}
              className="flex flex-col items-center"
            >
              <div className="bg-black/40 rounded-full p-3">
                <FaComment className="text-3xl text-white" />
              </div>
              <span className="text-white text-xs mt-1">
                {commentCounts[video.id] ||
                  Object.keys(video.comments || {}).length}
              </span>
            </button>

            <button className="flex flex-col items-center">
              <div className="bg-black/40 rounded-full p-3">
                <FaShare className="text-3xl text-white" />
              </div>
              <span className="text-white text-xs mt-1">Compartir</span>
            </button>
          </div>

          <button
            onClick={(e) => toggleMute(index, e)}
            className="absolute top-20 right-4 bg-black/40 rounded-full p-2 pointer-events-auto"
          >
            {videoRefs.current[index]?.muted ? (
              <FaVolumeMute className="text-white text-xl" />
            ) : (
              <FaVolumeUp className="text-white text-xl" />
            )}
          </button>
        </div>
      ))}

      {showComments && selectedPost && (
        <CommentsModal
          post={selectedPost}
          onClose={() => {
            setShowComments(false);
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
};

export default Video;
