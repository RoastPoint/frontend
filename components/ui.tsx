"use client";
import { Leaf, Coffee, Plus, Minus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { photo, type MenuItem } from "@/lib/api";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <Leaf size={32} strokeWidth={1} />
      <div className="brand-name">
        ROAST
        <br className="brand-break" /> POINT
      </div>
      <span>кофе, который рядом</span>
    </div>
  );
}
export function FoodImage({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <img className={className} src={photo(name)} alt={name} loading="lazy" />
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Coffee size={37} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Stepper({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (delta: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="stepper">
      <button
        aria-label="Уменьшить количество"
        disabled={disabled}
        onClick={() => onChange(-1)}
      >
        <Minus size={14} />
      </button>
      <span>{value}</span>
      <button
        aria-label="Увеличить количество"
        disabled={disabled || value >= 1000}
        onClick={() => onChange(1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function Modal({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") {
          const controls = Array.from(
            dialog.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]',
            ) || [],
          );
          const first = controls[0],
            last = controls[controls.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <section
        ref={dialog}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close icon-button"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        {children}
      </section>
    </div>
  );
}
export type CartLine = { item: MenuItem; quantity: number };
