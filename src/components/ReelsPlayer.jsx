// components/ReelsPlayer.jsx
import { useEffect, useRef, useState } from "react";
import { FaHeart, FaComment, FaShare, FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toggleReelLike, addReelComment } from "../utils/reelsService";

export default function ReelsPlayer({ reel, currentUser, isActive, onMute, isMuted }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  
  useEffect(() => {
    if (reel?.likes) {
      setLiked(!!reel.likes[currentUser?.uid]);
      setLikesCount(Object.keys(reel.likes).length);
    }
  }, [reel, currentUser]);
  
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  const handleLike = async () => {
    await toggleReelLike(reel.id, currentUser.uid);
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };
  
  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addReelComment(reel.id, currentUser.uid, currentUser.name, currentUser.picture, commentText);
    setCommentText("");
    setShowComments(false);
  };
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };
  
  return (
    <div className="relative h-screen w-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnail}
        className="w-full h-full object-contain"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
      />
      
      {/* Overlay de progreso (solo cuando no está reproduciendo) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button onClick={togglePlay} className="bg-white/20 p-4 rounded-full">
            <FaPlay className="text-white text-3xl" />
          </button>
        </div>
      )}
      
      {/* Barra de progreso */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
        <div className="h-full bg-red-500" style={{ width: `${progress}%` }} />
      </div>
      
      {/* Botón de volumen */}
      <button
        onClick={() => onMute(!isMuted)}
        className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
      >
        {isMuted ? <FaVolumeMute className="text-white" /> : <FaVolumeUp className="text-white" />}
      </button>
      
      {/* Información del usuario */}
      <div className="absolute bottom-20 left-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <img src={reel.userPhoto} alt={reel.userName} className="w-10 h-10 rounded-full" />
          <span className="font-bold text-lg">{reel.userName}</span>
          <span className="text-xs text-gray-300">
            {formatDistanceToNow(reel.createdAt, { addSuffix: true, locale: es })}
          </span>
        </div>
        <p className="text-sm mb-1">{reel.title}</p>
        <p className="text-xs text-gray-300 mb-2">{reel.description}</p>
        <div className="flex gap-2">
          {reel.hashtags?.map((tag, i) => (
            <span key={i} className="text-blue-400 text-xs">#{tag}</span>
          ))}
        </div>
      </div>
      
      {/* Acciones laterales */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-4">
        <button onClick={handleLike} className="flex flex-col items-center">
          <FaHeart className={`text-3xl ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          <span className="text-white text-xs mt-1">{likesCount}</span>
        </button>
        
        <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center">
          <FaComment className="text-3xl text-white" />
          <span className="text-white text-xs mt-1">
            {reel.comments ? Object.keys(reel.comments).length : 0}
          </span>
        </button>
        
        <button className="flex flex-col items-center">
          <FaShare className="text-3xl text-white" />
          <span className="text-white text-xs mt-1">Compartir</span>
        </button>
      </div>
      
      {/* Panel de comentarios */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-4 max-h-96 overflow-y-auto">
          <h3 className="text-white font-bold mb-3">Comentarios</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {reel.comments && Object.entries(reel.comments)
              .sort((a, b) => b[1].timestamp - a[1].timestamp)
              .map(([id, comment]) => (
                <div key={id} className="flex gap-2">
                  <img src={comment.userPhoto} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-white text-sm font-bold">{comment.userName}</p>
                    <p className="text-gray-300 text-sm">{comment.text}</p>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-gray-800 text-white p-2 rounded-lg"
            />
            <button onClick={handleComment} className="bg-red-500 px-4 rounded-lg">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}