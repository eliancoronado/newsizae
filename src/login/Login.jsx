// Login.jsx
import React, { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { auth, provider, db } from "../firebase";
import { signInWithPopup, signInWithCustomToken } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { generateCustomToken } from "../utils/generateCustomToken";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  // Agrega estos estados al inicio del componente, después de los otros useState
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiError, setApiError] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);

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
          lastSeen: Date.now(),
        });
      } else {
        const existingData = snapshot.val();
        // Usuario existente: actualizar últimos datos
        await set(userRef, {
          ...snapshot.val(),
          name: existingData.name || firebaseUser.displayName,
          photo: existingData.photo || firebaseUser.photoURL,
          email: firebaseUser.email,
          lastSeen: Date.now(),
        });
      }

      // 4. Guardar en localStorage para uso rápido
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          picture: firebaseUser.photoURL,
        }),
      );
      localStorage.setItem("token", token);

      // 5. Redirigir al dashboard
      //navigate("/dashboard");
      const customToken = await generateCustomToken(firebaseUser.uid);

      window.location.href = `babooapp://auth?token=${customToken}`;
    } catch (error) {
      console.error("Error login:", error);
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  // Función para iniciar sesión con API Key
  // Función para iniciar sesión con API Key
  const loginWithApiKey = async () => {
    setLoadingApi(true);
    setApiError(null);

    try {
      // Parsear el input
      let parsedData;
      try {
        parsedData = JSON.parse(apiKeyInput);
      } catch (e) {
        throw new Error("Formato inválido. Debe ser un JSON válido");
      }

      // Soporta diferentes formatos
      let userData, token;
      if (parsedData.user && parsedData.token) {
        userData = parsedData.user;
        token = parsedData.token;
      } else if (parsedData.uid && parsedData.email) {
        userData = parsedData;
        token = parsedData.token || parsedData.accessToken;
      } else {
        throw new Error(
          "El JSON debe contener 'user' y 'token' o datos de usuario válidos",
        );
      }

      if (!userData.uid) {
        throw new Error("El usuario debe tener un campo 'uid'");
      }

      // 🔥 Generar un Custom Token de Firebase usando la clave privada
      const customToken = await generateCustomToken(userData.uid);

      if (!customToken) {
        throw new Error("No se pudo generar el token personalizado");
      }

      // Iniciar sesión con el Custom Token
      try {
        await signInWithCustomToken(auth, customToken);
        console.log("✅ Sesión Firebase creada con Custom Token");
      } catch (authError) {
        console.error("Error al iniciar sesión con Custom Token:", authError);
        throw new Error("No se pudo autenticar con Firebase");
      }

      // Guardar en localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: userData.uid,
          name: userData.name || userData.displayName || "Usuario",
          email: userData.email || "",
          picture:
            userData.photo || userData.photoURL || userData.picture || "",
        }),
      );
      localStorage.setItem("token", customToken);
      localStorage.setItem("apiLogin", "true");
      localStorage.setItem("apiUid", userData.uid);

      // Verificar/crear usuario en Firebase Database
      try {
        const userRef = ref(db, `users/${userData.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
          await set(userRef, {
            uid: userData.uid,
            email: userData.email || "",
            name: userData.name || userData.displayName || "Usuario",
            photo:
              userData.photo || userData.photoURL || userData.picture || "",
            bio: "Hola, estoy usando esta increíble app",
            role: "bronze",
            coverPhoto: null,
            projects: [],
            friends: {},
            sentRequests: {},
            receivedRequests: {},
            createdAt: Date.now(),
            lastSeen: Date.now(),
          });
        }
      } catch (dbError) {
        console.warn("Error al verificar/crear usuario en DB:", dbError);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error con API Key:", error);
      setApiError(error.message);
    } finally {
      setLoadingApi(false);
    }
  };

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
          <span>
            {loading ? "Iniciando sesión..." : "Iniciar sesión con Google"}
          </span>
        </button>

        {/* Botón de API Key */}
        <button
          onClick={() => setShowApiModal(true)}
          className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl border border-gray-600 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] mt-3"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <span>Entrar con API Key</span>
        </button>

        {/* Línea decorativa */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Al iniciar sesión aceptas nuestros términos y condiciones
        </div>
      </div>

      {/* Modal para API Key */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Entrar con API Key
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Ingresa el JSON con tus credenciales
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Credenciales (JSON)
                </label>
                <textarea
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder='Ejemplo: {"user": {"uid": "123", "name": "Juan"}, "token": "abc123"}'
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Formato esperado: {'{ "user": {...}, "token": "..." }'}
                </p>
              </div>

              {apiError && (
                <div className="mb-4 p-2 bg-red-100 text-red-600 rounded-lg text-xs text-center">
                  {apiError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApiModal(false);
                    setApiKeyInput("");
                    setApiError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={loginWithApiKey}
                  disabled={loadingApi || !apiKeyInput.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loadingApi ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validando...
                    </div>
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
