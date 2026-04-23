// Login.jsx
import React, { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      navigate("/dashboard");
    }
  }, []);


  async function loginWithGoogle() {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Iniciar sesión con Google
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // 2. Obtener token (ya no lo enviamos al backend)
      const token = await firebaseUser.getIdToken();
      
      // 3. Guardar datos del usuario en Firebase Realtime Database
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        // Usuario nuevo: crear registro completo
        await set(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photo: firebaseUser.photoURL,
          bio: "Hola, estoy usando esta increíble app",
          role: "bronze",
          coverPhoto: null,
          projects: [],
          friends: {},
          sentRequests: {},
          receivedRequests: {},
          createdAt: Date.now(),
          lastSeen: Date.now()
        });
      } else {
        // Usuario existente: actualizar últimos datos
        await set(userRef, {
          ...snapshot.val(),
          name: firebaseUser.displayName,
          photo: firebaseUser.photoURL,
          email: firebaseUser.email,
          lastSeen: Date.now()
        });
      }
      
      // 4. Guardar en localStorage para uso rápido
      localStorage.setItem("user", JSON.stringify({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        picture: firebaseUser.photoURL
      }));
      localStorage.setItem("token", token);
      
      // 5. Redirigir al dashboard
      navigate("/dashboard");
      
    } catch (error) {
      console.error("Error login:", error);
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      {/* Card elegante */}
      <div className="max-w-md w-full bg-[rgba(132,132,132,0.4)] backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 transition-all duration-300 hover:shadow-xl border border-white/20">
        {/* Isologo del programa */}
        <div className="w-2/3 mx-auto drop-shadow-lg">
          <img src="/logo2.png" alt="" />
        </div>

        {/* Texto de bienvenida */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-gray-800 tracking-tight">
            Bienvenido
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Accede a tu cuenta de forma segura
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Único botón: Iniciar sesión con Google */}
        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FcGoogle className="w-6 h-6" />
          )}
          <span>{loading ? "Iniciando sesión..." : "Iniciar sesión con Google"}</span>
        </button>

        {/* Línea decorativa */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Al iniciar sesión aceptas nuestros términos y condiciones
        </div>
      </div>
    </div>
  );
};

export default Login;