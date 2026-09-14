"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import { ReceiveForm, type PoLine } from "./ReceiveForm";
import { useI18n } from "@/i18n";

/** Server components cannot hold state, so the dialog lives here. */
export function ReceiveButton({
  poId, poNumber, lines, warehouses, warehouseId, disabled,
}: {
  poId: number; poNumber: string; lines: PoLine[];
  warehouses: { id: number; code: string; name: string }[];
  warehouseId: number | null; disabled?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <PackageCheck className="h-4 w-4" />{t("purchasing.receivePo")}
      </button>
      {open && (
        <ReceiveForm
          poId={poId}
          poNumber={poNumber}
          lines={lines}
          warehouses={warehouses}
          warehouseId={warehouseId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
