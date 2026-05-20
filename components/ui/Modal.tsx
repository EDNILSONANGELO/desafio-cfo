"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        /* Em mobile: alinha embaixo (items-end). Em sm+: centraliza */
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal — bottom sheet em mobile, card centralizado em sm+ */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={`relative flex w-full flex-col
              max-h-[92vh]
              rounded-t-3xl sm:rounded-3xl
              border border-white/10 bg-slate-900 shadow-2xl
              ${sizes[size]}`}
          >
            {/* Cabeçalho fixo */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4 sm:p-6">
              {/* Drag handle (visual — mobile) */}
              <div className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/20 sm:hidden" />
              <h2 className="text-base font-black text-white sm:text-lg">{title}</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>

            {/* Rodapé fixo */}
            {footer && (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 p-4 sm:gap-3 sm:p-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
