// components/StorePage.jsx
import { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaCartPlus,
  FaHistory,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { ref, get, update, push, set, onValue } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { IoDiamond } from "react-icons/io5";
import { IoIosSend } from "react-icons/io";

const DIAMOND_PACKS = [
  { id: 1, diamonds: 100, price: 0.99, icon: "💎", bonus: 0 },
  { id: 2, diamonds: 500, price: 4.99, icon: "💎", bonus: 25 },
  { id: 3, diamonds: 1200, price: 9.99, icon: "💎", bonus: 100 },
  { id: 4, diamonds: 2500, price: 19.99, icon: "💎", bonus: 250 },
  { id: 5, diamonds: 6000, price: 49.99, icon: "💎", bonus: 800 },
  { id: 6, diamonds: 15000, price: 99.99, icon: "👑", bonus: 2500 },
];

export default function StorePage() {
  const [user, setUser] = useState(null);
  const [userDiamonds, setUserDiamonds] = useState(0);
  const [activeTabLocal, setActiveTabLocal] = useState("buy");
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUser(user);
      loadUserDiamonds(user.uid);
      loadFriends(user.uid);
      loadTransactionHistory(user.uid);
      setLoading(false);
    } else {
      navigate("/");
    }
  }, []);

  const loadUserDiamonds = async (uid) => {
    const diamondsRef = ref(db, `users/${uid}/diamonds`);
    const snapshot = await get(diamondsRef);
    setUserDiamonds(snapshot.val() || 0);
    // Listener en tiempo real
    onValue(diamondsRef, (snap) => {
      setUserDiamonds(snap.val() || 0);
    });
  };

  const loadFriends = async (uid) => {
    const friendsRef = ref(db, `users/${uid}/friends`);
    const snapshot = await get(friendsRef);
    const friendsData = snapshot.val() || {};
    const friendsList = [];
    for (const friendId of Object.keys(friendsData)) {
      const userRef = ref(db, `users/${friendId}`);
      const userSnap = await get(userRef);
      if (userSnap.exists()) {
        friendsList.push({
          uid: friendId,
          name: userSnap.val().name,
          photo: userSnap.val().photo,
        });
      }
    }
    setFriends(friendsList);
  };

  const loadTransactionHistory = async (uid) => {
    const historyRef = ref(db, `transactions/${uid}`);
    const snapshot = await get(historyRef);
    if (snapshot.exists()) {
      const historyList = Object.entries(snapshot.val())
        .map(([id, tx]) => ({ id, ...tx }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setHistory(historyList);
    }
  };

  const processPayment = async () => {
    if (!selectedPack) return;
    setProcessingPayment(true);
    setTimeout(async () => {
      try {
        const totalDiamonds = selectedPack.diamonds + selectedPack.bonus;
        const newBalance = userDiamonds + totalDiamonds;
        await update(ref(db, `users/${user.uid}`), { diamonds: newBalance });
        const txRef = push(ref(db, `transactions/${user.uid}`));
        await set(txRef, {
          type: "purchase",
          amount: totalDiamonds,
          price: selectedPack.price,
          packName: `${selectedPack.diamonds} Diamantes`,
          timestamp: Date.now(),
        });
        alert(`¡Has adquirido ${totalDiamonds} Diamantes!`);
        setShowPaymentModal(false);
        setSelectedPack(null);
        await loadTransactionHistory(user.uid);
      } catch (error) {
        alert("Error al procesar el pago");
      } finally {
        setProcessingPayment(false);
      }
    }, 1500);
  };

  const sendDiamonds = async () => {
    const amount = parseInt(transferAmount);
    if (!selectedFriend || isNaN(amount) || amount <= 0) {
      alert("Selecciona un amigo y un monto válido");
      return;
    }
    if (amount > userDiamonds) {
      alert("No tienes suficientes diamantes");
      return;
    }

    setProcessingPayment(true);

    try {
      // 1. Actualizar diamantes del remitente
      const newSenderBalance = userDiamonds - amount;
      await update(ref(db, `users/${user.uid}`), {
        diamonds: newSenderBalance,
      });
      setUserDiamonds(newSenderBalance);

      // 2. Actualizar diamantes del destinatario
      const receiverRef = ref(db, `users/${selectedFriend.uid}/diamonds`);
      const receiverSnap = await get(receiverRef);
      const receiverBalance = receiverSnap.val() || 0;
      await update(ref(db, `users/${selectedFriend.uid}`), {
        diamonds: receiverBalance + amount,
      });

      // 3. Registrar transacciones (con try-catch individual para que no detengan el flujo)
      try {
        const senderTx = push(ref(db, `transactions/${user.uid}`));
        await set(senderTx, {
          type: "sent",
          amount,
          to: selectedFriend.uid,
          toName: selectedFriend.name,
          timestamp: Date.now(),
        });
      } catch (txError) {
        console.warn("Error guardando historial de envío:", txError);
        // No mostramos error al usuario
      }

      try {
        const receiverTx = push(ref(db, `transactions/${selectedFriend.uid}`));
        await set(receiverTx, {
          type: "received",
          amount,
          from: user.uid,
          fromName: user.displayName,
          timestamp: Date.now(),
        });
      } catch (txError) {
        console.warn("Error guardando historial de recepción:", txError);
        // No mostramos error al usuario
      }

      alert(`✅ Has enviado ${amount} Diamantes a ${selectedFriend.name}`);
      setSelectedFriend(null);
      setTransferAmount("");
      await loadTransactionHistory(user.uid);
    } catch (error) {
      console.error("Error sending diamonds:", error);
      alert("Error al enviar diamantes");
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatDate = (timestamp) => new Date(timestamp).toLocaleString();

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Cargando...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-white hover:text-gray-300"
          >
            <FaArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Tienda de Diamantes</h1>
          <div className="bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2">
            <IoDiamond className="text-blue-400" />
            <span className="text-white font-bold">{userDiamonds}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["buy", "transfer", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTabLocal(tab)}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${activeTabLocal === tab ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {tab === "buy" ? (
                <FaCartPlus className="inline mr-2" />
              ) : tab === "transfer" ? (
                <IoIosSend className="inline mr-2" />
              ) : (
                <FaHistory className="inline mr-2" />
              )}
              {tab === "buy"
                ? "Comprar"
                : tab === "transfer"
                  ? "Transferir"
                  : "Historial"}
            </button>
          ))}
        </div>

        {/* Tab Comprar */}
        {activeTabLocal === "buy" && (
          <div className="space-y-4">
            {DIAMOND_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="bg-gray-800 rounded-xl p-4 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{pack.icon}</span>
                  <div>
                    <p className="text-white font-bold">
                      {pack.diamonds} Diamantes
                    </p>
                    {pack.bonus > 0 && (
                      <p className="text-green-400 text-sm">
                        +{pack.bonus} BONO
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">${pack.price}</p>
                  <button
                    onClick={() => {
                      setSelectedPack(pack);
                      setShowPaymentModal(true);
                    }}
                    className="mt-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-lg text-sm transition"
                  >
                    Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Transferir */}
        {activeTabLocal === "transfer" && (
          <div>
            <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-6 text-center mb-6">
              <IoDiamond className="text-4xl text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-300">Tus Diamantes</p>
              <p className="text-4xl font-bold text-white">{userDiamonds}</p>
            </div>
            <p className="text-white font-semibold mb-3">Enviar a un amigo</p>
            <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
              {friends.map((friend) => (
                <button
                  key={friend.uid}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex flex-col flex-shrink-0 items-center w-40 py-3 px-5 rounded-xl transition ${selectedFriend?.uid === friend.uid ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}
                >
                  <img
                    src={friend.photo}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                  />
                  <span className="text-white text-sm">
                    {friend.name.split(" ")[0]}
                  </span>
                  {selectedFriend?.uid === friend.uid && (
                    <FaCheck className="text-green-400 text-xs mt-1" />
                  )}
                </button>
              ))}
            </div>
            {selectedFriend && (
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-300 mb-2">Monto a enviar</p>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mb-3"
                  placeholder="0"
                />
                <button
                  onClick={sendDiamonds}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <IoIosSend /> Enviar Diamantes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Historial */}
        {activeTabLocal === "history" && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay transacciones aún
              </div>
            ) : (
              history.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-800 rounded-xl p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "purchase" ? "bg-purple-600" : tx.type === "sent" ? "bg-orange-600" : "bg-green-600"}`}
                    >
                      {tx.type === "purchase"
                        ? "🛒"
                        : tx.type === "sent"
                          ? "📤"
                          : "📥"}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {tx.type === "purchase"
                          ? `Compra de ${tx.packName}`
                          : tx.type === "sent"
                            ? `Enviado a ${tx.toName}`
                            : `Recibido de ${tx.fromName}`}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold ${tx.type === "sent" ? "text-orange-400" : "text-green-400"}`}
                  >
                    {tx.type === "sent" ? `-${tx.amount}` : `+${tx.amount}`}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && selectedPack && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Pagar con tarjeta
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center mb-4">
              <p className="text-white font-bold">
                {selectedPack.diamonds} Diamantes
              </p>
              {selectedPack.bonus > 0 && (
                <p className="text-green-400 text-sm">
                  +{selectedPack.bonus} BONO
                </p>
              )}
              <p className="text-yellow-400 font-bold mt-2">
                ${selectedPack.price}
              </p>
            </div>
            <div className="space-y-3 grid grid-cols-2 grid-rows-3 gap-2">
              <input
                type="text"
                placeholder="Número de tarjeta"
                className="w-full col-span-2 bg-gray-700 text-white rounded-lg px-4 py-2"
              />
              <input
                type="text"
                placeholder="MM/AA"
                className="flex-1 row-start-2 bg-gray-700 text-white rounded-lg px-4 py-2"
              />
              <input
                type="text"
                placeholder="CVV"
                className="flex-1 row-start-2 bg-gray-700 text-white rounded-lg px-4 py-2"
              />
              <input
                type="text"
                placeholder="Nombre del titular"
                defaultValue={user?.displayName || ""}
                className="w-full col-span-2 row-start-3 bg-gray-700 text-white rounded-lg px-4 py-2"
              />
            </div>
            <button
              onClick={processPayment}
              disabled={processingPayment}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
            >
              {processingPayment
                ? "Procesando..."
                : `Pagar $${selectedPack.price}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
