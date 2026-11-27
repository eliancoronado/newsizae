import { motion, AnimatePresence } from "framer-motion";
import {
  RxPlus, RxMinus, RxDotsVertical,
  RxDesktop, RxMobile, RxCopy, RxClipboard,
  RxUpload, RxDownload, RxFilePlus,
} from "react-icons/rx";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuGroup, DropdownMenuShortcut,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useState } from "react";

// ─────────────────────────────────────────────
// Componente de botón del toolbar (reutilizable)
// ─────────────────────────────────────────────
const ToolBtn = ({ icon: Icon, label, onClick, accent = false }) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative">
      <AnimatePresence>
        {hover && label && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md
                       bg-[#0F0E1A] text-white text-[11px] font-medium whitespace-nowrap
                       pointer-events-none border border-white/10 shadow-lg z-50"
          >
            {label}
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0F0E1A] rotate-45 border-l border-b border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={`
          w-9 h-9 flex items-center justify-center rounded-lg
          text-[#FFD966]/90 hover:bg-white/[0.08] hover:text-[#FFD966]
          transition-colors duration-150
          ${accent ? "bg-[#FFD966] text-[#1C1B2F] hover:bg-[#FFD966] hover:text-[#1C1B2F]" : ""}
        `}
      >
        <Icon className="text-base" />
      </motion.button>
    </div>
  );
};

const ToolDivider = () => <div className="w-6 h-px bg-white/10 my-1 self-center" />;

// ─────────────────────────────────────────────
// Toolbar principal
// ─────────────────────────────────────────────
const CanvasToolbar = ({
  scale, decreaseScale, increaseScale, setScale,
  widthDevice, setWithDevice, heightDevice, setHeightDevice, dpi, setDpi,
  setPosition, setModalOpen, handleSave, handleCopy, handlePaste,
  setQrCode, setDeviceShow, setDroppedElements, setIsExportModalOpen,
}) => {
  const [importOpen, setImportOpen] = useState(false);
  const [importCode, setImportCode] = useState("");

  const toggleDevice = () => {
    if (widthDevice === "1366px") {
      setWithDevice("430px");
      setPosition({ x: 83, y: -183 });
      setScale(0.8);
      setHeightDevice("932px");
      setDpi("0.33");
    } else {
      setWithDevice("1366px");
      setScale(0.6);
      setPosition({ x: -383, y: -72 });
      setHeightDevice("768px");
      setDpi("0.7");
    }
  };

  return (
    <div className="absolute z-30 top-4 left-4">
      {/* Glow sutil */}
      <div className="absolute inset-0 blur-2xl bg-[#FFD966]/5 rounded-2xl -z-10" />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        className="
          flex flex-col items-center gap-1 p-1.5
          rounded-2xl bg-[#1C1B2F]/80 backdrop-blur-xl
          border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)]
          w-12
        "
      >
        {/* ── Zoom in ── */}
        <ToolBtn icon={RxPlus} label="Acercar · ⌘+" onClick={increaseScale} />

        {/* ── Porcentaje (click = 100%) ── */}
        <button
          onClick={() => setScale(1)}
          className="w-9 h-8 flex items-center justify-center text-[11px] font-semibold
                     text-[#FFD966]/90 hover:bg-white/[0.08] rounded-lg
                     transition-colors duration-150"
          title="Reset zoom (100%)"
        >
          {Math.round(scale * 100)}%
        </button>

        {/* ── Zoom out ── */}
        <ToolBtn icon={RxMinus} label="Alejar · ⌘−" onClick={decreaseScale} />

        <ToolDivider />

        {/* ── Dropdown de acciones ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="w-9 h-9 flex items-center justify-center rounded-lg
                         text-[#FFD966]/90 hover:bg-white/[0.08] hover:text-[#FFD966]
                         transition-colors duration-150"
            >
              <RxDotsVertical className="text-base" />
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={12}
            className="w-60 rounded-xl bg-[#1C1B2F] border-white/10 text-white shadow-2xl"
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40">
              Página
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setModalOpen(true)}>
              <RxFilePlus className="mr-2" /> Nueva página
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40">
              Vista
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={toggleDevice}>
              {widthDevice === "1366px" ? (
                <RxMobile className="mr-2" />
              ) : (
                <RxDesktop className="mr-2" />
              )}
              Modo {widthDevice === "1366px" ? "Teléfono" : "Computadora"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setQrCode(true)}>
              <RxDownload className="mr-2" /> Abrir link dev
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeviceShow((p) => !p)}>
              <RxDesktop className="mr-2" /> Abrir emulador
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40">
              Proyecto
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleSave}>
              <RxUpload className="mr-2" /> Guardar
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <RxCopy className="mr-2" /> Copiar
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePaste}>
              <RxClipboard className="mr-2" /> Pegar
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem onSelect={() => setImportOpen(true)}>
              <RxDownload className="mr-2" /> Importar código
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsExportModalOpen(true)}>
              <RxUpload className="mr-2" /> Exportar / Solicitar APK
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* ── Dialog de Importar (fuera del dropdown) ── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1C1B2F] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Importar código</DialogTitle>
            <DialogDescription className="text-white/60">
              Puedes importar código Obj para trabajar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="import-code" className="text-white/80">
              Código Obj
            </Label>
            <Textarea
              id="import-code"
              value={importCode}
              className="max-h-[200px] w-full p-2 rounded-md font-mono
                         bg-[#0F0E1A] border-white/10 text-white placeholder:text-white/30"
              placeholder="Pega aquí tu código Obj..."
              onChange={(e) => setImportCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                try {
                  const parsed = JSON.parse(importCode);
                  setDroppedElements(Array.isArray(parsed) ? parsed : [parsed]);
                  toast.success("Código importado correctamente");
                  setImportOpen(false);
                  setImportCode("");
                } catch {
                  toast.error("El JSON ingresado es inválido");
                }
              }}
              className="bg-[#FFD966] text-[#1C1B2F] hover:bg-[#FFD966]/90"
            >
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CanvasToolbar;