"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import axios from "axios";
import { Cell } from "@/components/InvoiceBuilder";

interface Invoice {
  _id: string;
  cells: Cell[];
  invoiceNumber: number;
  templateName?: string;
  backgroundImage?: string;
  showBorders?: boolean;
}

export default function EditInvoice() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`/api/invoices/${invoiceId}`);
        setInvoice(response.data.data);
      } catch (err) {
        setError("Failed to load invoice");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Invoice not found"}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InvoiceBuilder
      initialCells={invoice.cells}
      initialBackgroundImage={invoice.backgroundImage || ""}
      initialShowBorders={invoice.showBorders !== false}
      initialInvoiceNumber={invoice.invoiceNumber}
      invoiceId={invoiceId}
      isEditing={true}
    />
  );
}
