"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ClientForm from "./client-form";
import Modal from "./modal";

export default function NewRequestButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSaved() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" className="new-appointment" onClick={() => setOpen(true)}>
        + Nueva solicitud
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva solicitud"
        subtitle="Registra un cliente o una cita manualmente."
      >
        <ClientForm submitLabel="Guardar solicitud" onSaved={handleSaved} />
      </Modal>
    </>
  );
}
