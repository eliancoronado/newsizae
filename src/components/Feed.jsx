// components/Feed.jsx
import { useEffect, useState } from "react";
import { ref, push, onValue, update, remove, set, get } from "firebase/database";
import { db } from "../firebase";
import { uploadToImgBB } from "../utils/uploadImage";
import {
  FaHeart,
  FaComment,
  FaTrash,
  FaLock,
  FaGlobe,
  FaImages,
  FaTimes,
  FaPencilAlt,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Feed = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImages, setNewPostImages] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [expandedImage, setExpandedImage] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false); // Nuevo estado para controlar el formulario en móvil

  // Obtener amigos del backend
  const [friendsIds, setFriendsIds] = useState([]);

  // REEMPLAZA CON ESTE:
useEffect(() => {
  // Obtener lista de amigos desde Firebase
  const fetchFriends = async () => {
    const userRef = ref(db, `users/${currentUser.uid}/friends`);
    const snapshot = await get(userRef);
    const friendsObj = snapshot.val() || {};
    setFriendsIds(Object.keys(friendsObj));
  };
  fetchFriends();
}, [currentUser.uid]);

  // Escuchar posts en tiempo real
  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsList = Object.entries(data)
          .map(([id, post]) => ({ id, ...post, likes: post.likes || {}, comments: post.comments || {} }))
          .filter((post) => {
            if (post.privacy === "public") return true;
            if (post.privacy === "friends" && friendsIds.includes(post.userId))
              return true;
            if (post.userId === currentUser.uid) return true;
            return false;
          })
          .sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsList);
      } else {
        setPosts([]);
      }
    });
    return () => unsubscribe();
  }, [friendsIds, currentUser.uid]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (newPostImages.length + files.length > 10) {
      alert("Máximo 10 imágenes por post");
      return;
    }
    setUploading(true);
    const uploadedUrls = [];
    for (const file of files) {
      const url = await uploadToImgBB(file);
      uploadedUrls.push(url);
    }
    setNewPostImages([...newPostImages, ...uploadedUrls]);
    setUploading(false);
  };

  const removeImage = (index) => {
    setNewPostImages(newPostImages.filter((_, i) => i !== index));
  };

  const createPost = async () => {
    if (!newPostContent.trim() && newPostImages.length === 0) return;
    const postData = {
      userId: currentUser.uid,
      userName: currentUser.name,
      userPhoto: currentUser.picture,
      content: newPostContent,
      images: newPostImages,
      privacy: privacy,
      timestamp: Date.now(),
      likes: {},
      comments: {},
    };
    const postsRef = ref(db, "posts");
    const newPostRef = push(postsRef);
    await set(newPostRef, postData);
    // También guardar referencia en userPosts
    const userPostsRef = ref(
      db,
      `userPosts/${currentUser.uid}/${newPostRef.key}`,
    );
    await set(userPostsRef, true);
    setNewPostContent("");
    setNewPostImages([]);
    setPrivacy("public");
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
      await remove(ref(db, `posts/${postId}`));
      await remove(ref(db, `userPosts/${currentUser.uid}/${postId}`));
    }
  };

    // Función para resetear el formulario y cerrarlo
  const closePostForm = () => {
    setShowPostForm(false);
    setNewPostContent("");
    setNewPostImages([]);
    setPrivacy("public");
  };

  // Componente para collage de imágenes
  const ImageCollage = ({ images }) => {
    const count = images.length;
    if (count === 0) return null;
    if (count === 1) {
      return (
        <img
          src={images[0]}
          alt="post"
          className="w-full rounded-lg cursor-pointer"
          onClick={() => setExpandedImage(images[0])}
        />
      );
    }
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="post"
              className="w-full h-64 object-cover rounded-lg cursor-pointer"
              onClick={() => setExpandedImage(img)}
            />
          ))}
        </div>
      );
    }
    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-1">
          <img
            src={images[0]}
            alt="post"
            className="col-span-1 h-64 w-full object-cover rounded-lg cursor-pointer"
            onClick={() => setExpandedImage(images[0])}
          />
          <div className="grid grid-rows-2 gap-1">
            <img
              src={images[1]}
              alt="post"
              className="h-32 w-full object-cover rounded-lg cursor-pointer"
              onClick={() => setExpandedImage(images[1])}
            />
            <img
              src={images[2]}
              alt="post"
              className="h-32 w-full object-cover rounded-lg cursor-pointer"
              onClick={() => setExpandedImage(images[2])}
            />
          </div>
        </div>
      );
    }
    // 4+ imágenes: grid de 2x2
    return (
      <div className="grid grid-cols-2 gap-1">
        {images.slice(0, 4).map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt="post"
            className="w-full h-48 object-cover rounded-lg cursor-pointer"
            onClick={() => setExpandedImage(img)}
          />
        ))}
        {images.length > 4 && (
          <div
            className="relative cursor-pointer"
            onClick={() => setExpandedImage(images[4])}
          >
            <img
              src={images[4]}
              alt="post"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold rounded-lg">
              +{images.length - 4}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Modal para imagen expandida */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="expandida"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setExpandedImage(null)}
          >
            ✕
          </button>
        </div>
      )}

       {/* Formulario para crear post - Desktop: siempre visible */}
      <div className="hidden md:block bg-[#242526] rounded-xl p-4 mb-6 shadow">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="¿Qué estás pensando?"
          className="w-full bg-[#3A3B3C] text-white p-3 rounded-lg resize-none focus:outline-none"
          rows="3"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {newPostImages.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20">
              <img
                src={img}
                alt="preview"
                className="w-full h-full object-cover rounded"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
              >
                <FaTimes className="w-3 h-3 text-white" />
              </button>
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
                accept="image/*"
                onChange={handleImageUpload}
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

      {/* Formulario para crear post - Móvil: Modal flotante */}
      {showPostForm && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 z-50 w-full h-full flex items-center justify-center md:hidden">
          <div className="bg-[#242526] rounded-t-2xl w-full animate-slide-up">
            <div className="flex justify-between items-center p-4 border-b border-[#3E4042]">
              <h3 className="text-white font-semibold text-lg">Crear publicación</h3>
              <button
                onClick={closePostForm}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="¿Qué estás pensando?"
                className="w-full bg-[#3A3B3C] text-white p-3 rounded-lg resize-none focus:outline-none"
                rows="4"
                autoFocus
              />
              
              <div className="flex flex-wrap gap-2 mt-2">
                {newPostImages.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img
                      src={img}
                      alt="preview"
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    >
                      <FaTimes className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <label className="bg-[#3A3B3C] p-2 rounded-full cursor-pointer">
                    <FaImages className="text-[#2e9b4f] text-xl" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
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
                  className="bg-[#2e9b4f] px-6 py-2 rounded-full font-semibold"
                  disabled={!newPostContent.trim() && newPostImages.length === 0}
                >
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante para móvil */}
      <button
        onClick={() => setShowPostForm(true)}
        className="md:hidden fixed bottom-24 right-4 bg-[#2e9b4f] text-white p-4 rounded-full shadow-lg hover:bg-[#268e46] transition-all z-40 flex items-center justify-center"
      >
        <FaPencilAlt className="text-xl" />
      </button>

      {/* Feed de posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
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
            {post.images?.length > 0 && <ImageCollage images={post.images} />}

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
        {posts.length === 0 && (
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
