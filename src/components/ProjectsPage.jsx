// components/ProjectsPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaShare,
  FaHistory,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaFolderOpen,
  FaArrowRight,
  FaSyncAlt,
} from "react-icons/fa";
import {
  getUserProjects,
  createProject,
  updateProjectName,
  deleteProject,
  shareProject,
  getProjectHistory,
} from "../utils/projectsService";
import { getMyFriends } from "../firebaseService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { ref, get, runTransaction } from "firebase/database";
import { db } from "../firebase";

/* ───────────────────────── Datos ───────────────────────── */
const CREATE_COST = 100;
const REFRESH_AFTER_MS = 30000; // revalida al volver a la pestaña si pasaron 30 s

const LANGS = {
  waskart: {
    name: "Waskart",
    icon: "⚡",
    grad: "from-blue-500 to-blue-600",
    glow: "#3B82F6",
    desc: "Programación tradicional con sintaxis limpia",
    sel: "border-blue-500 bg-blue-500/10",
  },
  javascript: {
    name: "JavaScript",
    icon: "🟨",
    grad: "from-yellow-400 to-yellow-500",
    glow: "#FACC15",
    desc: "Programación web profesional con JavaScript moderno",
    sel: "border-yellow-400 bg-yellow-400/10",
  },
  bloques: {
    name: "Quí-roz",
    icon: "🧩",
    grad: "from-purple-500 to-pink-500",
    glow: "#A855F7",
    desc: "Programación visual por bloques, ideal para principiantes",
    sel: "border-purple-500 bg-purple-500/10",
  },
};

/* ───────────────────────── Utilidades ───────────────────────── */
// Solo guardamos lo que la lista necesita (los proyectos completos pueden pesar mucho)
const slim = (p) => ({
  id: p.id,
  name: p.name,
  language: p.language,
  authorId: p.authorId,
  isShared: !!p.isShared,
  originalAuthor: p.originalAuthor,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  pageCount: p.pageCount ?? p.pages?.length ?? 1,
});
const readCache = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado: no pasa nada */
  }
};
const ago = (t) => {
  if (!t) return "fecha desconocida";
  try {
    return formatDistanceToNow(t, { addSuffix: true, locale: es });
  } catch {
    return "fecha desconocida";
  }
};
const buzz = (ms = 10) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no soportado */
  }
};

const CSS = `
@keyframes pp-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pp-fade{from{opacity:0}to{opacity:1}}
@keyframes pp-sheet{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes pp-pop{0%{transform:scale(1)}40%{transform:scale(1.22)}100%{transform:scale(1)}}
@keyframes pp-glow{0%,100%{box-shadow:0 0 0 0 rgba(124,108,255,0)}50%{box-shadow:0 0 0 7px rgba(124,108,255,.28)}}
@keyframes pp-toast{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}
.pp-rise{animation:pp-rise .45s cubic-bezier(.2,.8,.2,1) both}
.pp-fade{animation:pp-fade .2s ease-out both}
.pp-sheet{animation:pp-sheet .28s cubic-bezier(.2,.8,.2,1) both}
.pp-pop{animation:pp-pop .4s ease-out}
.pp-glow{animation:pp-glow 1.2s ease-in-out 2}
.pp-toast{animation:pp-toast .25s ease-out both}
.pp-scroll{scrollbar-width:none}
.pp-scroll::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.pp-rise,.pp-fade,.pp-sheet,.pp-pop,.pp-glow,.pp-toast{animation:none}}
`;

/* ───────────────────────── Piezas reutilizables ───────────────────────── */
const Avatar = ({ name, photo, size = 40 }) => {
  const [bad, setBad] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const style = { width: size, height: size };
  return photo && !bad ? (
    <img src={photo} alt="" style={style} onError={() => setBad(true)} className="rounded-full object-cover shrink-0" />
  ) : (
    <div style={style} className="rounded-full shrink-0 bg-[#7C6CFF]/25 text-[#C9C1FF] font-semibold flex items-center justify-center">
      {initial}
    </div>
  );
};

const Spinner = () => <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />;

/* Hoja inferior en móvil, diálogo centrado en pantallas grandes */
const Sheet = ({ open, onClose, title, subtitle, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pp-fade" onClick={onClose} />
      <div className="pp-sheet relative w-full sm:max-w-md max-h-[92dvh] flex flex-col bg-[#1B1B2E] border border-[#38385A] rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="sm:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-[#4A4A6A]" />
        <div className="flex items-start gap-3 px-5 pt-4 pb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#F2F2F7] leading-tight">{title}</h2>
            {subtitle && <p className="text-sm text-[#9A9AB8] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-11 h-11 -mr-2 -mt-1 rounded-full flex items-center justify-center text-[#9A9AB8] active:bg-white/5">
            <FaTimes />
          </button>
        </div>
        <div className="px-5 pb-4 overflow-y-auto overscroll-contain flex-1">{children}</div>
        {footer && <div className="px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[#2E2E4A]">{footer}</div>}
      </div>
    </div>
  );
};

const Action = ({ icon: Icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full h-14 px-2 rounded-2xl flex items-center gap-3.5 text-[15px] font-medium active:bg-white/5 ${danger ? "text-[#FF7B7B]" : "text-[#F2F2F7]"}`}
  >
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? "bg-red-500/15" : "bg-white/5"}`}>
      <Icon className="text-sm" />
    </span>
    {label}
  </button>
);

const PrimaryBtn = ({ children, className = "", ...p }) => (
  <button
    type="button"
    {...p}
    className={`h-12 px-5 rounded-2xl bg-[#7C6CFF] text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] active:bg-[#6A5AEB] transition disabled:opacity-40 disabled:active:scale-100 ${className}`}
  >
    {children}
  </button>
);
const GhostBtn = ({ children, className = "", ...p }) => (
  <button type="button" {...p} className={`h-12 px-5 rounded-2xl bg-[#2A2A43] text-[#E4E4F0] font-medium active:bg-[#33334F] transition ${className}`}>
    {children}
  </button>
);

const SkeletonCard = () => (
  <div className="rounded-2xl bg-[#1E1E31] border border-[#2E2E4A] p-4 flex gap-3.5 animate-pulse">
    <div className="w-12 h-12 rounded-2xl bg-[#2E2E4A]" />
    <div className="flex-1 space-y-2.5 pt-1">
      <div className="h-4 w-2/3 rounded bg-[#2E2E4A]" />
      <div className="h-3 w-1/3 rounded bg-[#2E2E4A]" />
    </div>
  </div>
);

const MenuDots = ({ onClick, className = "" }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label="Más acciones"
    className={`w-11 h-11 rounded-full flex items-center justify-center text-[#9A9AB8] active:bg-white/10 ${className}`}
  >
    <FaEllipsisV className="text-sm" />
  </button>
);

const LangTile = ({ lang, size = 48 }) => (
  <span
    style={{ width: size, height: size, fontSize: size * 0.5 }}
    className={`shrink-0 rounded-2xl bg-gradient-to-br ${lang.grad} flex items-center justify-center shadow-lg`}
  >
    {lang.icon}
  </span>
);

const ProjectCard = ({ project, onOpen, onMenu, highlight, delay }) => {
  const lang = LANGS[project.language] || LANGS.waskart;
  const when = `${project.updatedAt ? "Editado" : "Creado"} ${ago(project.updatedAt || project.createdAt)}`;
  return (
    <article
      className={`relative rounded-2xl bg-[#1E1E31] border transition active:scale-[0.985] ${
        highlight ? "border-[#7C6CFF] pp-glow" : "border-[#2E2E4A] hover:border-[#4A4A78]"
      } ${delay != null ? "pp-rise" : ""}`}
      style={delay != null ? { animationDelay: `${delay}ms` } : undefined}
    >
      <button type="button" onClick={onOpen} className="w-full text-left p-4 pr-14 flex items-center gap-3.5 rounded-2xl">
        <LangTile lang={lang} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[16px] text-[#F2F2F7] truncate">{project.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#9A9AB8]">
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[#D0D0E4]">{lang.name}</span>
            <span>
              {project.pageCount} {project.pageCount === 1 ? "página" : "páginas"}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 text-xs text-[#7E7EA0]">
            {project.isShared && (
              <span className="flex items-center gap-1 text-[#8FA8FF]">
                <FaShare className="text-[10px]" /> De {project.originalAuthor}
              </span>
            )}
            <span>{when}</span>
          </span>
        </span>
      </button>
      <MenuDots onClick={onMenu} className="absolute right-1.5 top-1/2 -translate-y-1/2" />
    </article>
  );
};

const Hero = ({ project, onOpen, onMenu, animate }) => {
  const lang = LANGS[project.language] || LANGS.waskart;
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-[#38385A] p-5 ${animate ? "pp-rise" : ""}`}
      style={{ background: `radial-gradient(120% 140% at 100% 0%, ${lang.glow}38 0%, transparent 58%), #1E1E31` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[#B4B4CE]">Continuar donde lo dejaste</p>
        <MenuDots onClick={onMenu} className="-mt-2 -mr-2" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <LangTile lang={lang} size={64} />
        <div className="min-w-0">
          <h2
            className="text-xl font-bold leading-tight text-[#F2F2F7] break-words"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {project.name}
          </h2>
          <p className="mt-1 text-sm text-[#9A9AB8]">
            {lang.name} · {project.updatedAt ? "editado" : "creado"} {ago(project.updatedAt || project.createdAt)}
          </p>
        </div>
      </div>
      <PrimaryBtn onClick={onOpen} className="mt-5 w-full h-13 py-3.5">
        Abrir proyecto <FaArrowRight className="text-sm" />
      </PrimaryBtn>
    </section>
  );
};

/* ───────────────────────── Página ───────────────────────── */
export default function ProjectsPage({ currentUser }) {
  const navigate = useNavigate();
  const uid = currentUser?.uid;
  const rootRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [diamonds, setDiamonds] = useState(null); // null = aún cargando
  const [intro, setIntro] = useState(true);
  const [highlightId, setHighlightId] = useState(null);
  const [toast, setToast] = useState(null);

  // Hojas / modales
  const [createOpen, setCreateOpen] = useState(false);
  const [lang, setLang] = useState("waskart");
  const [creating, setCreating] = useState(false);
  const [menuTarget, setMenuTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [role, setRole] = useState("editor");
  const [sharing, setSharing] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deniedMsg, setDeniedMsg] = useState("");

  const hasData = useRef(false);
  const lastFetch = useRef(0);
  const lastMutation = useRef(0);
  const friendsCache = useRef(null);

  const notify = useCallback((msg, tone = "ok", action = null) => setToast({ id: Date.now(), msg, tone, action }), []);

  /* ── Carga de proyectos: caché al instante + revalidación en segundo plano ── */
  const loadProjects = useCallback(
    async ({ silent = false } = {}) => {
      if (!uid) return;
      const started = Date.now();
      if (silent) setRefreshing(true);
      try {
        const list = await getUserProjects(uid);
        // Si el usuario modificó algo mientras cargábamos, no pisamos su cambio con datos viejos
        if (lastMutation.current < started) {
          hasData.current = true;
          setProjects(list.map(slim));
        }
        setError(false);
        lastFetch.current = Date.now();
      } catch (e) {
        console.error("[ProjectsPage] Error cargando proyectos:", e);
        if (hasData.current) notify("Sin conexión: mostrando lo último guardado", "warn");
        else setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [uid, notify]
  );

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const cached = readCache(`pp:projects:${uid}`, null);
    if (cached) {
      hasData.current = true;
      setProjects(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setDiamonds(readCache(`pp:diamonds:${uid}`, null));

    // Las dos lecturas arrancan a la vez y cada una pinta en cuanto llega
    loadProjects();
    get(ref(db, `users/${uid}/diamonds`))
      .then((snap) => setDiamonds(snap.val() || 0))
      .catch((e) => console.error("[ProjectsPage] Error cargando diamantes:", e));
  }, [uid, loadProjects]);

  useEffect(() => {
    if (uid && hasData.current) writeCache(`pp:projects:${uid}`, projects);
  }, [projects, uid]);
  useEffect(() => {
    if (uid && diamonds !== null) writeCache(`pp:diamonds:${uid}`, diamonds);
  }, [diamonds, uid]);

  // Al volver a la pestaña/app, refresca si pasaron más de 30 s
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetch.current > REFRESH_AFTER_MS) {
        loadProjects({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadProjects]);

  // Animación de entrada solo la primera vez
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setIntro(false), 900);
    return () => clearTimeout(t);
  }, [loading]);

  // Toast con auto-cierre
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.action ? 5000 : 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Quitar el resplandor del proyecto recién creado
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightId]);

  /* ── Datos derivados ── */
  const sorted = useMemo(
    () => [...projects].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)),
    [projects]
  );
  const chips = useMemo(() => {
    const langs = [...new Set(projects.map((p) => p.language).filter((l) => LANGS[l]))];
    return [
      { id: "all", label: "Todos", n: projects.length },
      { id: "mine", label: "Míos", n: projects.filter((p) => !p.isShared).length },
      { id: "shared", label: "Compartidos", n: projects.filter((p) => p.isShared).length },
      ...langs.map((l) => ({ id: l, label: LANGS[l].name, n: projects.filter((p) => p.language === l).length })),
    ];
  }, [projects]);

  const q = search.trim().toLowerCase();
  const filtered = sorted.filter((p) => {
    const okFilter =
      filter === "all" ||
      (filter === "mine" && !p.isShared) ||
      (filter === "shared" && p.isShared) ||
      p.language === filter;
    return okFilter && (!q || p.name?.toLowerCase().includes(q));
  });
  const hero = filter === "all" && !q ? filtered[0] : null;
  const rest = hero ? filtered.slice(1) : filtered;
  const firstName = (currentUser?.name || "").trim().split(" ")[0];
  const lacksDiamonds = diamonds !== null && diamonds < CREATE_COST;

  /* ── Acciones ── */
  const openProject = (p) => {
    if (p.authorId === uid || p.isShared) {
      navigate(`/project/${p.id}`);
      return;
    }
    setDeniedMsg(`No tienes permiso para acceder a "${p.name}". Solo el autor o usuarios con rol de editor pueden entrar.`);
  };

  const handleCreate = async () => {
    if (creating) return;
    if (lacksDiamonds) {
      notify(`Necesitas ${CREATE_COST} 💎 para crear un proyecto`, "error");
      return;
    }
    setCreating(true);
    const balanceRef = ref(db, `users/${uid}/diamonds`);
    try {
      // Cobro atómico: se descuenta en el servidor y no se puede gastar dos veces
      const tx = await runTransaction(balanceRef, (cur) => {
        // En la primera pasada el valor local puede ser null; devolvemos una estimación
        // para forzar a Firebase a reintentar con el valor real del servidor.
        const n = cur === null ? diamonds ?? 0 : cur;
        return n >= CREATE_COST ? n - CREATE_COST : undefined;
      });
      if (!tx.committed) {
        notify(`Necesitas ${CREATE_COST} 💎 para crear un proyecto`, "error");
        return;
      }
      setDiamonds(tx.snapshot.val() || 0);

      try {
        const created = await createProject(uid, lang, currentUser.name);
        const item = { ...slim(created), authorId: created.authorId ?? uid, createdAt: created.createdAt ?? Date.now() };
        lastMutation.current = Date.now();
        hasData.current = true;
        setProjects((prev) => (prev.some((p) => p.id === item.id) ? prev : [item, ...prev]));
        setFilter("all");
        setSearch("");
        setHighlightId(item.id);
        setCreateOpen(false);
        setLang("waskart");
        rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        buzz(25);
        notify("¡Proyecto creado!", "ok", { label: "Abrir", run: () => navigate(`/project/${item.id}`) });
      } catch (e) {
        // Si falla la creación, devolvemos los diamantes
        await runTransaction(balanceRef, (cur) => (cur ?? 0) + CREATE_COST).catch(() => {});
        setDiamonds((d) => (d ?? 0) + CREATE_COST);
        throw e;
      }
    } catch (e) {
      console.error("Error creating project:", e);
      notify("No se pudo crear el proyecto. No se cobró nada.", "error");
    } finally {
      setCreating(false);
    }
  };

  const doRename = async () => {
    const target = renameTarget;
    const name = renameValue.trim();
    if (!target || !name) return;
    const prev = projects;
    lastMutation.current = Date.now();
    setProjects((ps) => ps.map((p) => (p.id === target.id ? { ...p, name } : p)));
    setRenameTarget(null);
    try {
      await updateProjectName(target.id, name);
      notify("Nombre actualizado");
    } catch (e) {
      console.error("Error renaming project:", e);
      setProjects(prev);
      notify("No se pudo renombrar el proyecto", "error");
    }
  };

  const doDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    const prev = projects;
    lastMutation.current = Date.now();
    setProjects((ps) => ps.filter((p) => p.id !== target.id));
    setDeleteTarget(null);
    try {
      await deleteProject(target.id, uid);
      buzz(15);
      notify("Proyecto eliminado");
    } catch (e) {
      console.error("Error deleting project:", e);
      setProjects(prev);
      notify("No se pudo eliminar el proyecto", "error");
    }
  };

  const openShare = (project) => {
    setMenuTarget(null);
    setShareTarget(project);
    setSelectedFriend(null);
    setRole("editor");
    // La hoja se abre al instante; los amigos llegan después (y se guardan para la próxima vez)
    if (friendsCache.current) setFriends(friendsCache.current);
    else setFriendsLoading(true);
    getMyFriends(uid)
      .then((list) => {
        friendsCache.current = list;
        setFriends(list);
      })
      .catch((e) => {
        console.error("Error loading friends:", e);
        notify("No se pudieron cargar tus amigos", "error");
      })
      .finally(() => setFriendsLoading(false));
  };

  const doShare = async () => {
    if (!selectedFriend || !shareTarget) return;
    setSharing(true);
    try {
      await shareProject(shareTarget.id, uid, selectedFriend.uid, selectedFriend.name, selectedFriend.photo, role);
      buzz(20);
      notify(`Compartido con ${selectedFriend.name} como ${role === "editor" ? "editor" : "lector"}`);
      setShareTarget(null);
      setSelectedFriend(null);
    } catch (e) {
      console.error("Error sharing project:", e);
      notify(e.message || "No se pudo compartir el proyecto", "error");
    } finally {
      setSharing(false);
    }
  };

  const openHistory = async (project) => {
    setMenuTarget(null);
    setHistoryTarget(project);
    setHistory([]);
    setHistoryLoading(true);
    try {
      setHistory(await getProjectHistory(project.id));
    } catch (e) {
      console.error("Error loading history:", e);
      notify("No se pudo cargar el historial", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openMenu = (p) => {
    buzz(8);
    setMenuTarget(p);
  };
  const openCreate = () => {
    buzz(10);
    setCreateOpen(true);
  };

  /* ───────── Render ───────── */
  return (
    <div ref={rootRef} className="max-h-full overflow-y-auto overscroll-contain bg-[#14141F] text-[#F2F2F7] font-[Inter,sans-serif]">
      <style>{CSS}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="pt-6 sm:pt-8 pb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {firstName && <p className="text-sm text-[#9A9AB8]">Hola, {firstName}</p>}
            <h1 className="text-[28px] sm:text-4xl font-bold tracking-tight leading-tight">Mis proyectos</h1>
            <div className="mt-1 flex items-center gap-1 text-sm text-[#9A9AB8]">
              <span>
                {projects.length} {projects.length === 1 ? "proyecto" : "proyectos"}
              </span>
              <button
                type="button"
                onClick={() => loadProjects({ silent: true })}
                aria-label="Actualizar lista"
                className="w-9 h-9 rounded-full flex items-center justify-center active:bg-white/5"
              >
                <FaSyncAlt className={`text-xs ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openCreate}
              aria-label={diamonds === null ? "Diamantes" : `Tienes ${diamonds} diamantes`}
              className="h-11 px-4 rounded-full bg-[#25253B] border border-[#3A3A58] flex items-center gap-2 active:scale-95 transition"
            >
              <span>💎</span>
              {diamonds === null ? (
                <span className="w-7 h-4 rounded bg-[#3A3A58] animate-pulse" />
              ) : (
                <span key={diamonds} className="font-semibold tabular-nums pp-pop">
                  {diamonds}
                </span>
              )}
            </button>
            <PrimaryBtn onClick={openCreate} className="hidden sm:flex h-11">
              <FaPlus className="text-sm" /> Nuevo proyecto
            </PrimaryBtn>
          </div>
        </div>
      </div>

      {/* Buscador + filtros (se quedan fijos al hacer scroll) */}
      <div className="sticky top-0 z-30 bg-[#14141F]/90 backdrop-blur-xl border-b border-[#24243A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-3 space-y-2.5">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7E7EA0] text-sm pointer-events-none" />
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Buscar proyectos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-12 rounded-2xl bg-[#1E1E31] border border-[#2E2E4A] text-base text-[#F2F2F7] placeholder-[#7E7EA0] outline-none focus:border-[#7C6CFF] focus:ring-2 focus:ring-[#7C6CFF]/30 transition [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Borrar búsqueda" className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-[#9A9AB8] active:bg-white/5">
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
          {projects.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pp-scroll -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filtrar proyectos">
              {chips.map((c) => {
                const on = filter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => {
                      setFilter(c.id);
                      buzz(6);
                    }}
                    className={`shrink-0 h-10 px-4 rounded-full text-sm font-medium border transition active:scale-95 ${
                      on ? "bg-[#7C6CFF] border-[#7C6CFF] text-white" : "bg-[#1E1E31] border-[#2E2E4A] text-[#C9C9E0]"
                    }`}
                  >
                    {c.label}
                    <span className={`ml-1.5 tabular-nums ${on ? "text-white/80" : "text-[#7E7EA0]"}`}>{c.n}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-32 sm:pb-12">
        {!uid ? (
          <p className="text-center text-[#9A9AB8] py-20">Inicia sesión para ver tus proyectos.</p>
        ) : loading ? (
          <div className="space-y-3">
            <div className="h-48 rounded-3xl bg-[#1E1E31] border border-[#2E2E4A] animate-pulse" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <p className="text-lg font-semibold">No pudimos cargar tus proyectos</p>
            <p className="text-sm text-[#9A9AB8] mt-1">Revisa tu conexión e inténtalo de nuevo.</p>
            <PrimaryBtn
              className="mx-auto mt-5"
              onClick={() => {
                setLoading(true);
                setError(false);
                loadProjects();
              }}
            >
              <FaSyncAlt className="text-sm" /> Reintentar
            </PrimaryBtn>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-14 px-4 pp-rise">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 flex items-center justify-center">
              <FaFolderOpen className="text-4xl text-[#A89CFF]" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Tu primer proyecto te espera</h2>
            <p className="mt-2 text-[#9A9AB8] max-w-xs mx-auto">Elige un lenguaje y empieza a construir. Crear un proyecto cuesta {CREATE_COST} 💎.</p>
            <PrimaryBtn className="mx-auto mt-6" onClick={openCreate}>
              <FaPlus className="text-sm" /> Crear proyecto
            </PrimaryBtn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-lg font-semibold">No encontramos nada</p>
            <p className="text-sm text-[#9A9AB8] mt-1">Prueba con otro nombre o cambia el filtro.</p>
            <GhostBtn
              className="mx-auto mt-5"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Limpiar filtros
            </GhostBtn>
          </div>
        ) : (
          <div className="space-y-6">
            {hero && <Hero project={hero} animate={intro} onOpen={() => openProject(hero)} onMenu={() => openMenu(hero)} />}
            {rest.length > 0 && (
              <section>
                {hero && <h2 className="mb-3 text-sm font-semibold text-[#9A9AB8]">Más proyectos</h2>}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((p, i) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      highlight={highlightId === p.id}
                      delay={intro ? Math.min(i, 8) * 45 + 80 : null}
                      onOpen={() => openProject(p)}
                      onMenu={() => openMenu(p)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Botón flotante (móvil) */}
      <button
        type="button"
        onClick={openCreate}
        className="sm:hidden fixed right-4 z-40 h-14 pl-5 pr-6 rounded-full bg-[#7C6CFF] text-white font-semibold flex items-center gap-2 shadow-[0_10px_30px_-6px_rgba(124,108,255,0.75)] active:scale-95 transition"
        style={{ bottom: "10rem" }}
      >
        <FaPlus /> Nuevo
      </button>

      {/* Toast */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`pp-toast fixed left-1/2 z-[60] max-w-[calc(100vw-2rem)] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6 flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl border shadow-2xl backdrop-blur-xl ${
            toast.tone === "error"
              ? "bg-[#3A1D2A]/95 border-red-500/40 text-red-100"
              : toast.tone === "warn"
              ? "bg-[#3A3220]/95 border-yellow-500/40 text-yellow-100"
              : "bg-[#25253B]/95 border-[#4A4A78] text-[#F2F2F7]"
          }`}
        >
          <span className="text-sm py-1.5">{toast.msg}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action.run();
                setToast(null);
              }}
              className="h-9 px-3 rounded-xl bg-[#7C6CFF] text-white text-sm font-semibold active:scale-95"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {/* ── Hoja: acciones del proyecto ── */}
      <Sheet open={!!menuTarget} onClose={() => setMenuTarget(null)} title={menuTarget?.name || ""} subtitle={menuTarget ? (LANGS[menuTarget.language] || LANGS.waskart).name : ""}>
        {menuTarget && (
          <div className="-mx-1">
            <Action icon={FaArrowRight} label="Abrir" onClick={() => { const p = menuTarget; setMenuTarget(null); openProject(p); }} />
            <Action icon={FaEdit} label="Renombrar" onClick={() => { setRenameValue(menuTarget.name || ""); setRenameTarget(menuTarget); setMenuTarget(null); }} />
            <Action icon={FaShare} label="Compartir" onClick={() => openShare(menuTarget)} />
            {menuTarget.authorId === uid && <Action icon={FaHistory} label="Historial de cambios" onClick={() => openHistory(menuTarget)} />}
            <Action icon={FaTrash} label="Eliminar" danger onClick={() => { setDeleteTarget(menuTarget); setMenuTarget(null); }} />
          </div>
        )}
      </Sheet>

      {/* ── Hoja: crear proyecto ── */}
      <Sheet
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="Crear nuevo proyecto"
        subtitle="Elige el lenguaje con el que quieres empezar"
        footer={
          <div className="flex gap-3">
            <GhostBtn onClick={() => setCreateOpen(false)} disabled={creating} className="flex-1">
              Cancelar
            </GhostBtn>
            <PrimaryBtn onClick={handleCreate} disabled={creating || lacksDiamonds} className="flex-[1.6]">
              {creating ? (
                <>
                  <Spinner /> Creando…
                </>
              ) : lacksDiamonds ? (
                "Diamantes insuficientes"
              ) : (
                `Crear proyecto (${CREATE_COST} 💎)`
              )}
            </PrimaryBtn>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-[#25253B] p-3 text-center">
            <p className="text-xs text-[#9A9AB8]">Tus diamantes</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">💎 {diamonds ?? "…"}</p>
          </div>
          <div className="rounded-2xl bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 p-3 text-center">
            <p className="text-xs text-[#C9C1FF]">Costo</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-[#E2DDFF]">💎 {CREATE_COST}</p>
          </div>
        </div>
        {lacksDiamonds && (
          <p className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            Te faltan {CREATE_COST - diamonds} 💎 para crear un proyecto.
          </p>
        )}
        <div className="space-y-3" role="radiogroup" aria-label="Lenguaje">
          {Object.entries(LANGS).map(([key, l]) => {
            const on = lang === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setLang(key);
                  buzz(6);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition active:scale-[0.985] ${on ? l.sel : "border-[#2E2E4A] bg-[#1E1E31]"}`}
              >
                <LangTile lang={l} size={52} />
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[16px]">{l.name}</span>
                  <span className="block text-sm text-[#9A9AB8] leading-snug">{l.desc}</span>
                </span>
                <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${on ? "bg-[#7C6CFF] text-white" : "border border-[#4A4A6A]"}`}>
                  {on && <FaCheck className="text-[10px]" />}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* ── Hoja: renombrar ── */}
      <Sheet
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Renombrar proyecto"
        subtitle="Dale un nombre fácil de reconocer"
        footer={
          <div className="flex gap-3">
            <GhostBtn onClick={() => setRenameTarget(null)} className="flex-1">
              Cancelar
            </GhostBtn>
            <PrimaryBtn onClick={doRename} disabled={!renameValue.trim()} className="flex-[1.6]">
              Guardar cambios
            </PrimaryBtn>
          </div>
        }
      >
        <input
          type="text"
          autoFocus
          maxLength={60}
          enterKeyHint="done"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doRename()}
          placeholder="Nombre del proyecto"
          className="w-full h-12 px-4 rounded-2xl bg-[#25253B] border border-[#3A3A58] text-base text-[#F2F2F7] placeholder-[#7E7EA0] outline-none focus:border-[#7C6CFF] focus:ring-2 focus:ring-[#7C6CFF]/30"
        />
      </Sheet>

      {/* ── Hoja: confirmar eliminación ── */}
      <Sheet
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar proyecto?"
        subtitle={deleteTarget?.name}
        footer={
          <div className="flex gap-3">
            <GhostBtn onClick={() => setDeleteTarget(null)} className="flex-1">
              Cancelar
            </GhostBtn>
            <button type="button" onClick={doDelete} className="flex-[1.6] h-12 rounded-2xl bg-[#E5484D] text-white font-semibold active:scale-[0.98] transition">
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-[#B4B4CE] text-sm">Esta acción no se puede deshacer.</p>
      </Sheet>

      {/* ── Hoja: compartir ── */}
      <Sheet
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        title="Compartir proyecto"
        subtitle={shareTarget?.name}
        footer={
          <PrimaryBtn onClick={doShare} disabled={!selectedFriend || sharing} className="w-full">
            {sharing ? (
              <>
                <Spinner /> Compartiendo…
              </>
            ) : selectedFriend ? (
              `Compartir con ${selectedFriend.name}`
            ) : (
              "Elige un amigo"
            )}
          </PrimaryBtn>
        }
      >
        <p className="text-sm font-medium text-[#9A9AB8] mb-2">Amigos</p>
        <div className="space-y-2 max-h-64 overflow-y-auto overscroll-contain">
          {friendsLoading && friends.length === 0 ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#1E1E31] animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#2E2E4A]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 rounded bg-[#2E2E4A]" />
                  <div className="h-3 w-2/3 rounded bg-[#2E2E4A]" />
                </div>
              </div>
            ))
          ) : friends.length === 0 ? (
            <p className="text-center text-sm text-[#9A9AB8] py-6">Aún no tienes amigos para compartir.</p>
          ) : (
            friends.map((f) => {
              const on = selectedFriend?.uid === f.uid;
              return (
                <button
                  key={f.uid}
                  type="button"
                  onClick={() => {
                    setSelectedFriend(f);
                    buzz(6);
                  }}
                  aria-pressed={on}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition active:scale-[0.985] ${
                    on ? "border-[#7C6CFF] bg-[#7C6CFF]/10" : "border-transparent bg-[#1E1E31]"
                  }`}
                >
                  <Avatar name={f.name} photo={f.photo} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{f.name}</span>
                    <span className="block text-xs text-[#9A9AB8] truncate">{f.email}</span>
                  </span>
                  {on && <FaCheck className="text-[#A89CFF]" />}
                </button>
              );
            })
          )}
        </div>

        <p className="text-sm font-medium text-[#9A9AB8] mt-5 mb-2">Rol de acceso</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Rol de acceso">
          {[
            { id: "editor", icon: "✏️", name: "Editor", desc: "Puede editar y guardar" },
            { id: "reader", icon: "👁️", name: "Lector", desc: "Solo puede ver" },
          ].map((r) => {
            const on = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setRole(r.id)}
                className={`p-3.5 rounded-2xl border-2 text-center transition active:scale-[0.985] ${on ? "border-[#7C6CFF] bg-[#7C6CFF]/10" : "border-transparent bg-[#1E1E31]"}`}
              >
                <span className="block text-2xl">{r.icon}</span>
                <span className="block font-semibold mt-1">{r.name}</span>
                <span className="block text-xs text-[#9A9AB8]">{r.desc}</span>
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* ── Hoja: historial ── */}
      <Sheet open={!!historyTarget} onClose={() => setHistoryTarget(null)} title="Historial de cambios" subtitle={historyTarget?.name}>
        {historyLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#1E1E31] animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-sm text-[#9A9AB8] py-8">Todavía no hay cambios registrados.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#1E1E31]">
                <Avatar name={r.userName} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.userName}</p>
                  <p className="text-sm text-[#9A9AB8] truncate">{r.action}</p>
                </div>
                <time className="text-xs text-[#7E7EA0] shrink-0">{ago(r.timestamp)}</time>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      {/* ── Hoja: acceso denegado ── */}
      <Sheet
        open={!!deniedMsg}
        onClose={() => setDeniedMsg("")}
        title="Acceso denegado"
        footer={
          <PrimaryBtn onClick={() => setDeniedMsg("")} className="w-full">
            Entendido
          </PrimaryBtn>
        }
      >
        <p className="text-[#B4B4CE] text-sm leading-relaxed">{deniedMsg}</p>
      </Sheet>
    </div>
  );
}