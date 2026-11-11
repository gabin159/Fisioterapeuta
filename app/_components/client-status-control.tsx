"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { statusOptions } from "@/lib/content";
import { statusTone } from "@/lib/format";

const TONE_COLORS: Record<string, string> = {
  ok: "#1c7a4a",
  warn: "#a8720a",
  pending: "#1d4ed8",
};

const MENU_WIDTH = 208;
const OPTION_HEIGHT = 38;
const MENU_HEIGHT = 44 + statusOptions.length * OPTION_HEIGHT + 12;

export default function ClientStatusControl({
  clientId,
  estado,
}: {
  clientId: number;
  estado: string | null;
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(estado ?? "Pendiente");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setCurrent(estado ?? "Pendiente");
  }, [estado]);

  useEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const left = Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8
      );
      const opensUp = window.innerHeight - rect.bottom < MENU_HEIGHT + 12;
      const top = opensUp ? Math.max(8, rect.top - MENU_HEIGHT - 8) : rect.bottom + 8;
      setCoords({ top, left });
    }

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function handleScroll() {
      setOpen(false);
    }

    place();
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  async function choose(next: string) {
    if (next === current) {
      setOpen(false);
      return;
    }
    const previous = current;
    setCurrent(next);
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/clientes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: clientId, estado: next }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message ?? "No fue posible actualizar el estado.");
      }
      setOpen(false);
      router.refresh();
    } catch (updateError) {
      setCurrent(previous);
      setError(
        updateError instanceof Error ? updateError.message : "No fue posible actualizar el estado."
      );
    } finally {
      setSaving(false);
    }
  }

  const tone = statusTone(current);

  return (
    <span className="status-control">
      <button
        ref={triggerRef}
        type="button"
        className={`badge ${tone} status-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        disabled={saving}
        title="Cambiar estado"
      >
        <span className="status-dot" style={{ background: TONE_COLORS[tone] }} />
        {saving ? "Guardando…" : current}
        <span className="status-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {error && (
        <span className="status-error" role="alert">
          {error}
        </span>
      )}

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="status-menu"
            style={{ top: coords.top, left: coords.left }}
            role="menu"
            aria-label="Cambiar estado del cliente"
          >
            <p className="status-menu-title">Cambiar estado</p>
            {statusOptions.map((option) => {
              const optionTone = statusTone(option);
              return (
                <button
                  key={option}
                  type="button"
                  role="menuitem"
                  className={`status-option ${option === current ? "selected" : ""}`}
                  onClick={() => choose(option)}
                  disabled={saving}
                >
                  <span
                    className="status-dot"
                    style={{ background: TONE_COLORS[optionTone] }}
                  />
                  <span className="status-option-label">{option}</span>
                  {option === current && (
                    <span className="status-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </span>
  );
}
