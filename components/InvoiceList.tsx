"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Cell } from "@/components/InvoiceBuilder";

interface Invoice {
  _id: string;
  invoiceNumber: number;
  templateName?: string;
  createdAt: string;
  cells: Cell[];
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get("/api/invoices");
      setInvoices(response.data.data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      await axios.delete(`/api/invoices/${id}`);
      setInvoices(invoices.filter((inv) => inv._id !== id));
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  const getListFields = (cells: Cell[]) =>
    cells.filter((cell) => cell.showInList && cell.fieldName);

  const getCellValue = (cell: Cell) => {
    if (cell.type === "text") {
      // Strip HTML tags for plain text display
      const content = cell.content || "";
      const div = document.createElement("div");
      div.innerHTML = content;
      return div.textContent || div.innerText || "";
    }
    if (cell.type === "image") {
      return cell.imageSrc ? "[Image]" : "";
    }
    return "";
  };

  // Get all unique field names across all invoices
  const getAllListFieldNames = () => {
    const fieldNamesSet = new Set<string>();
    invoices.forEach((invoice) => {
      getListFields(invoice.cells).forEach((cell) => {
        if (cell.fieldName) {
          fieldNamesSet.add(cell.fieldName);
        }
      });
    });
    return Array.from(fieldNamesSet);
  };

  const getFieldValue = (invoice: Invoice, fieldName: string) => {
    const cell = invoice.cells.find(
      (c) => c.fieldName === fieldName && c.showInList
    );
    return cell ? getCellValue(cell) : "-";
  };

  const listFieldNames = getAllListFieldNames();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Invoices</h1>
          <Link
            href="/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Invoice
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No invoices yet</p>
            <Link
              href="/create"
              className="text-blue-600 hover:underline"
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {listFieldNames.map((fieldName) => (
                      <th
                        key={fieldName}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {fieldName}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      {listFieldNames.map((fieldName) => (
                        <td
                          key={fieldName}
                          className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate"
                          title={getFieldValue(invoice, fieldName)}
                        >
                          {getFieldValue(invoice, fieldName)}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/edit/${invoice._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteInvoice(invoice._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
