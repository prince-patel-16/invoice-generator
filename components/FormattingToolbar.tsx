"use client";

import { useEffect, useState } from "react";

interface FormattingToolbarProps {
  onFormat: (command: string, value?: string) => void;
}

export default function FormattingToolbar({
  onFormat,
}: FormattingToolbarProps) {
  const [isActive, setIsActive] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    const checkActiveFormats = () => {
      setIsActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    };

    // Check on mouse up and key up
    document.addEventListener("mouseup", checkActiveFormats);
    document.addEventListener("keyup", checkActiveFormats);

    return () => {
      document.removeEventListener("mouseup", checkActiveFormats);
      document.removeEventListener("keyup", checkActiveFormats);
    };
  }, []);

  const handleFormat = (command: string, value?: string) => {
    onFormat(command, value);
    // Update active state after formatting
    setTimeout(() => {
      setIsActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    }, 10);
  };

  return (
    <div className="absolute -top-12 left-0 bg-white border border-gray-300 rounded shadow-lg flex items-center gap-1 p-1 z-50">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleFormat("bold");
        }}
        className={`px-3 py-1 rounded hover:bg-gray-100 font-bold ${
          isActive.bold ? "bg-blue-100 text-blue-700" : ""
        }`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleFormat("italic");
        }}
        className={`px-3 py-1 rounded hover:bg-gray-100 italic ${
          isActive.italic ? "bg-blue-100 text-blue-700" : ""
        }`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleFormat("underline");
        }}
        className={`px-3 py-1 rounded hover:bg-gray-100 underline ${
          isActive.underline ? "bg-blue-100 text-blue-700" : ""
        }`}
        title="Underline (Ctrl+U)"
      >
        U
      </button>
    </div>
  );
}
