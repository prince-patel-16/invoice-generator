"use client";

import { useEffect, useRef } from "react";

interface CellContextMenuProps {
  x: number;
  y: number;
  cellId: string;
  onDelete: () => void;
  onAddCellToDirection: (
    direction: "top" | "bottom" | "left" | "right"
  ) => void;
  onClose: () => void;
}

export default function CellContextMenu({
  x,
  y,
  onDelete,
  onAddCellToDirection,
  onClose,
}: CellContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded shadow-lg z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <button
        onClick={() => {
          onAddCellToDirection("top");
          onClose();
        }}
        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        Add Cell to Top
      </button>
      <button
        onClick={() => {
          onAddCellToDirection("bottom");
          onClose();
        }}
        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        Add Cell to Bottom
      </button>
      <button
        onClick={() => {
          onAddCellToDirection("left");
          onClose();
        }}
        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        Add Cell to Left
      </button>
      <button
        onClick={() => {
          onAddCellToDirection("right");
          onClose();
        }}
        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        Add Cell to Right
      </button>
      <div className="border-t my-1"></div>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 text-sm"
      >
        Delete Cell
      </button>
    </div>
  );
}
