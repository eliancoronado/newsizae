// components/SubscriptionPage.jsx
import { useState, useEffect } from "react";
import {
  FaCheck,
  FaStar,
  FaCrown,
  FaGem,
  FaRocket,
  FaKey,
  FaCreditCard,
  FaGift,
  FaLock,
  FaUnlockAlt,
  FaSpinner,
  FaArrowLeft,
  FaUsers,
  FaCode,
  FaCloudUploadAlt,
  FaHeadset,
  FaChartLine,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../firebaseService";

// Planes de suscripción
const PLANS = {
  free: {
    id: "free",
    name: "Gratuito",
    price: 0,
    priceDisplay: "Gratis",
    icon: FaStar,
    color: "from-gray-500 to-gray-600",
    textColor: "text-gray-400",
    badge: "Básico",
    features: [
      "✅ 1 proyecto activo",
      "✅ Almacenamiento: 50MB",
      "✅ Editor básico",
      "✅ Soporte por email",
      "✅ Proyectos públicos",
    ],
    limitations: [
      "❌ Sin proyectos colaborativos",
      "❌ Sin acceso a IA avanzada",
      "❌ Sin exportar código",
      "❌ Sin historial de versiones",
    ],
  },
  bronze: {
    id: "bronze",
    name: "Programador",
    price: 4.99,
    priceDisplay: "$4.99",
    priceYearly: 49.99,
    icon: FaRocket,
    color: "from-amber-600 to-amber-700",
    textColor: "text-amber-400",
    badge: "Popular",
    features: [
      "✅ 5 proyectos activos",
      "✅ Almacenamiento: 1GB",
      "✅ Editor avanzado",
      "✅ Soporte prioritario",
      "✅ Proyectos colaborativos",
      "✅ 2 colaboradores por proyecto",
      "✅ Exportar código",
    ],
    limitations: [],
  },
  silver: {
    id: "silver",
    name: "Plata",
    price: 9.99,
    priceDisplay: "$9.99",
    priceYearly: 99.99,
    icon: FaGem,
    color: "from-gray-400 to-gray-500",
    textColor: "text-gray-300",
    badge: "Recomendado",
    features: [
      "✅ 15 proyectos activos",
      "✅ Almacenamiento: 5GB",
      "✅ Editor profesional",
      "✅ Soporte 24/7",
      "✅ Proyectos colaborativos",
      "✅ 5 colaboradores por proyecto",
      "✅ Exportar código",
      "✅ Historial de versiones",
      "✅ Temas personalizados",
    ],
    limitations: [],
  },
  gold: {
    id: "gold",
    name: "Oro",
    price: 19.99,
    priceDisplay: "$19.99",
    priceYearly: 199.99,
    icon: FaCrown,
    color: "from-yellow-500 to-yellow-600",
    textColor: "text-yellow-400",
    badge: "Mejor valor",
    features: [
      "✅ Proyectos ilimitados",
      "✅ Almacenamiento: 20GB",
      "✅ Editor profesional+",
      "✅ Soporte VIP",
      "✅ Proyectos colaborativos",
      "✅ Colaboradores ilimitados",
      "✅ Exportar código",
      "✅ Historial ilimitado",
      "✅ Temas personalizados",
      "✅ IA avanzada",
      "✅ Analíticas de proyecto",
    ],
    limitations: [],
  },
  platinum: {
    id: "platinum",
    name: "Platino",
    price: 49.99,
    priceDisplay: "$49.99",
    priceYearly: 499.99,
    icon: FaGem,
    color: "from-cyan-400 to-blue-500",
    textColor: "text-cyan-400",
    badge: "Máximo potencial",
    features: [
      "✅ Proyectos ilimitados",
      "✅ Almacenamiento: 100GB",
      "✅ Editor empresarial",
      "✅ Soporte dedicado 24/7",
      "✅ Colaboradores ilimitados",
      "✅ API personalizada",
      "✅ Exportar todos los formatos",
      "✅ Historial con restauración",
      "✅ IA avanzada + entrenamiento",
      "✅ Analíticas avanzadas",
      "✅ Dominio personalizado",
      "✅ Certificaciones oficiales",
    ],
    limitations: [],
  },
};

// Claves de activación predefinidas (en producción esto estaría en backend)
const ACTIVATION_KEYS = {
  "FREE-TRIAL-2024": { plan: "bronze", duration: 7, type: "trial" },
  "BRONZE-WEEK": { plan: "bronze", duration: 7, type: "premium" },
  "SILVER-MONTH": { plan: "silver", duration: 30, type: "premium" },
  "GOLD-MONTH": { plan: "gold", duration: 30, type: "premium" },
  "PLATINUM-3M": { plan: "platinum", duration: 90, type: "premium" },
  "EDUCATION-2024": { plan: "gold", duration: 365, type: "educational" },
  "DEVELOPER-PRO": { plan: "silver", duration: 30, type: "premium" },
  "YEARLY-BRONZE": { plan: "bronze", duration: 365, type: "yearly" },
  "YEARLY-SILVER": { plan: "silver", duration: 365, type: "yearly" },
  "YEARLY-GOLD": { plan: "gold", duration: 365, type: "yearly" },
};

const SubscriptionPage = ({setActiveTab}) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [activationKey, setActivationKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Simular suscripción actual (esto vendría de Firebase)
      const savedSubscription = localStorage.getItem(`subscription_${user.uid}`);
      if (savedSubscription) {
        setUserSubscription(JSON.parse(savedSubscription));
      } else {
        setUserSubscription({ plan: "free", expiresAt: null });
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleActivateKey = async () => {
    setActivating(true);
    setActivationMessage(null);

    // Simular verificación (en producción iría a backend)
    setTimeout(() => {
      const keyData = ACTIVATION_KEYS[activationKey.toUpperCase()];
      
      if (keyData) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + keyData.duration);
        
        const subscription = {
          plan: keyData.plan,
          type: keyData.type,
          activatedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          key: activationKey.toUpperCase(),
        };
        
        localStorage.setItem(`subscription_${currentUser.uid}`, JSON.stringify(subscription));
        setUserSubscription(subscription);
        //updateUserRole(currentUser.uid, keyData.plan);
        
        setActivationMessage({
          type: "success",
          text: `¡Activado! Ahora eres plan ${PLANS[keyData.plan].name} por ${keyData.duration} días.`,
        });
        
        setTimeout(() => {
          setShowKeyModal(false);
          setActivationKey("");
          setActivationMessage(null);
        }, 2000);
      } else {
        setActivationMessage({
          type: "error",
          text: "Clave inválida. Por favor verifica el código ingresado.",
        });
      }
      setActivating(false);
    }, 1500);
  };

  const handlePurchase = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const processPayment = () => {
    setPaymentProcessing(true);
    
    // Simular procesamiento de pago
    setTimeout(() => {
      const plan = PLANS[selectedPlan];
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      const subscription = {
        plan: selectedPlan,
        type: "premium",
        activatedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        paymentMethod: "card",
        amount: plan.price,
      };
      
      localStorage.setItem(`subscription_${currentUser.uid}`, JSON.stringify(subscription));
      setUserSubscription(subscription);
      //updateUserRole(currentUser.uid, selectedPlan);
      
      setPaymentProcessing(false);
      setShowPaymentModal(false);
      
      alert(`¡Gracias por tu compra! Ahora eres plan ${plan.name}`);
    }, 2000);
  };

  const getPlanPrice = (plan) => {
    if (billingCycle === "monthly") {
      return plan.priceDisplay;
    } else {
      return `$${plan.priceYearly}`;
    }
  };

  const getPlanSavings = (plan) => {
    if (billingCycle === "yearly" && plan.priceYearly) {
      const monthlyTotal = plan.price * 12;
      const savings = monthlyTotal - plan.priceYearly;
      const savingsPercent = Math.round((savings / monthlyTotal) * 100);
      return `Ahorra ${savingsPercent}%`;
    }
    return null;
  };

  const getCurrentPlanBadge = () => {
    if (!userSubscription || userSubscription.plan === "free") return null;
    const plan = PLANS[userSubscription.plan];
    const expires = new Date(userSubscription.expiresAt);
    const daysLeft = Math.ceil((expires - new Date()) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaUnlockAlt className="text-white text-2xl" />
            <div>
              <p className="text-white font-semibold">Plan actual: {plan.name}</p>
              <p className="text-green-200 text-sm">
                {daysLeft > 0 
                  ? `Válido hasta: ${expires.toLocaleDateString()} (${daysLeft} días restantes)`
                  : "Suscripción expirada"}
              </p>
            </div>
          </div>
          {daysLeft <= 7 && daysLeft > 0 && (
            <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
              <p className="text-yellow-300 text-sm">⚠️ Próximo a vencer</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f1117] to-[#13151f]">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/10 to-blue-500/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => setActiveTab("home")}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft /> Volver al dashboard
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-full mb-4">
              <FaCrown className="text-yellow-500" />
              <span className="text-white text-sm">Elige tu plan</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
              Desbloquea todo el potencial
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades y lleva tus proyectos al siguiente nivel
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mt-8 mb-12">
            <div className="bg-gray-800/50 rounded-full p-1 flex gap-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Anual
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current plan badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {getCurrentPlanBadge()}
      </div>

      {/* Plans grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => {
            const Icon = plan.icon;
            const isCurrentPlan = userSubscription?.plan === key;
            const hasActiveSubscription = userSubscription && userSubscription.plan !== "free";
            
            return (
              <div
                key={key}
                className={`relative group rounded-2xl transition-all duration-500 hover:transform hover:-translate-y-2 ${
                  isCurrentPlan
                    ? "ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20"
                    : "hover:shadow-2xl"
                }`}
              >
                {/* Badge flotante */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${key === "free" ? "from-gray-800/50 to-gray-900/50" : "from-gray-800/80 to-gray-900/80"} backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 h-full flex flex-col`}>
                  {/* Header */}
                  <div className={`p-6 text-center bg-gradient-to-br ${plan.color} bg-opacity-10`}>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="text-white text-3xl" />
                    </div>
                    <h3 className={`text-2xl font-bold ${plan.textColor} mb-2`}>
                      {plan.name}
                    </h3>
                    <div className="mt-3">
                      {billingCycle === "monthly" ? (
                        <>
                          <span className="text-3xl font-bold text-white">
                            {plan.priceDisplay}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-gray-400 text-sm">/mes</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-white">
                            ${plan.priceYearly}
                          </span>
                          <span className="text-gray-400 text-sm">/año</span>
                        </>
                      )}
                    </div>
                    {getPlanSavings(plan) && (
                      <p className="text-green-400 text-xs mt-2">
                        {getPlanSavings(plan)}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="p-6 flex-1">
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                      {plan.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm opacity-60">
                          <FaLock className="text-gray-500 text-xs flex-shrink-0" />
                          <span className="text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Button */}
                  <div className="p-6 pt-0">
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold opacity-75 cursor-default"
                      >
                        Plan Actual
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(key)}
                        disabled={hasActiveSubscription && key === "free"}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                          key === "free"
                            ? "bg-gray-700 text-white hover:bg-gray-600"
                            : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg hover:scale-105`
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {hasActiveSubscription && key === "free"
                          ? "Ya tienes un plan activo"
                          : plan.price === 0
                          ? "Plan Actual"
                          : "Suscribirse"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bonus features section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 text-center border border-purple-500/20">
            <FaUsers className="text-purple-400 text-3xl mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Colabora en equipo</h3>
            <p className="text-gray-400 text-sm">
              Invita a otros desarrolladores a tus proyectos y trabaja en equipo
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 text-center border border-blue-500/20">
            <FaCloudUploadAlt className="text-blue-400 text-3xl mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Almacenamiento en la nube</h3>
            <p className="text-gray-400 text-sm">
              Tus proyectos seguros y accesibles desde cualquier dispositivo
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 text-center border border-green-500/20">
            <FaHeadset className="text-green-400 text-3xl mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Soporte prioritario</h3>
            <p className="text-gray-400 text-sm">
              Atención personalizada para resolver tus dudas rápidamente
            </p>
          </div>
        </div>

        {/* Activation key section */}
        <div className="mt-16 text-center">
          <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
            <FaGift className="text-purple-400 text-4xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              ¿Tienes una clave de activación?
            </h3>
            <p className="text-gray-400 mb-6">
              Ingresa tu código para desbloquear beneficios exclusivos
            </p>
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <FaKey /> Activar clave
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>🔒 Pagos 100% seguros</span>
            <span>💳 Aceptamos todas las tarjetas</span>
            <span>🔄 Cancela cuando quieras</span>
            <span>📧 Soporte 24/7</span>
          </div>
        </div>
      </div>

      {/* Modal de activación de clave */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl transform animate-scaleUp">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaKey className="text-white text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Activar clave
                </h2>
                <p className="text-gray-400 text-sm">
                  Ingresa tu código de activación
                </p>
              </div>

              <input
                type="text"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder="Ej: BRONZE-MONTH"
                className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-center uppercase"
                autoFocus
              />

              {activationMessage && (
                <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
                  activationMessage.type === "success" 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {activationMessage.text}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowKeyModal(false);
                    setActivationKey("");
                    setActivationMessage(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleActivateKey}
                  disabled={activating || !activationKey.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activating ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Validando...
                    </div>
                  ) : (
                    "Activar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl transform animate-scaleUp">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaCreditCard className="text-white text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Completar pago
                </h2>
                <p className="text-gray-400 text-sm">
                  Plan {PLANS[selectedPlan].name} - {billingCycle === "monthly" ? "Mensual" : "Anual"}
                </p>
                <p className="text-3xl font-bold text-white mt-3">
                  {billingCycle === "monthly" 
                    ? PLANS[selectedPlan].priceDisplay
                    : `$${PLANS[selectedPlan].priceYearly}`}
                  <span className="text-sm text-gray-400">
                    /{billingCycle === "monthly" ? "mes" : "año"}
                  </span>
                </p>
              </div>

              {/* Simular campos de tarjeta */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Número de tarjeta"
                  defaultValue="**** **** **** 4242"
                  className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/AA"
                    defaultValue="12/26"
                    className="px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    defaultValue="123"
                    className="px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nombre en la tarjeta"
                  defaultValue={currentUser?.name || ""}
                  className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={processPayment}
                  disabled={paymentProcessing}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Procesando...
                    </div>
                  ) : (
                    `Pagar ${billingCycle === "monthly" ? PLANS[selectedPlan].priceDisplay : `$${PLANS[selectedPlan].priceYearly}`}`
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Pago seguro. No guardamos tu información de tarjeta.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;