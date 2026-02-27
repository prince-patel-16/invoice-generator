"use client";

import { useState, useEffect } from "react";
import { Cell } from "./InvoiceBuilder";

interface ImageAsset {
  _id: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

function ImagePropertiesSection({
  cell,
  onUpdateCell,
}: {
  cell: Cell;
  onUpdateCell: (cellId: string, updates: Partial<Cell>) => void;
}) {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);

  useEffect(() => {
    // Load assets on mount
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const response = await fetch("/api/image-assets");
      const result = await response.json();
      console.log("Assets loaded:", result);
      if (result.success && result.data) {
        setAssets(result.data);
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        try {
          const response = await fetch("/api/image-assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageData,
              mimeType: file.type,
            }),
          });

          const result = await response.json();
          if (result.success) {
            // Update cell with new image
            onUpdateCell(cell.id, {
              imageUrl: result.data.url,
              imageSrc: "",
              imageAssetId: result.data._id,
            });
            // Refresh asset list
            await loadAssets();
          } else {
            console.error("Upload failed:", result.error);
            alert("Failed to upload image");
          }
        } catch (error) {
          console.error("Error uploading:", error);
          alert("Error uploading image");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setLoading(false);
    }
  };

  const handleSelectExisting = (asset: ImageAsset) => {
    onUpdateCell(cell.id, {
      imageUrl: asset.url,
      imageSrc: "",
      imageAssetId: asset._id,
    });
  };

  const handleDeleteAsset = async (assetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this image? It will be hidden but existing invoices using it will still display it.")) {
      return;
    }

    try {
      const response = await fetch(`/api/image-assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: true }),
      });

      const result = await response.json();
      if (result.success) {
        // Reload asset list
        await loadAssets();
      } else {
        console.error("Delete failed:", result.error);
        alert("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting image");
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded">
      <h3 className="font-semibold text-sm mb-3">Image Properties</h3>

      {/* Upload Section */}
      <div className="mb-4">
        <label className="text-xs text-gray-700 block mb-2">Upload New Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
          }}
          disabled={loading}
          className="w-full text-sm"
        />
        {loading && <p className="text-xs text-blue-600 mt-2">Uploading...</p>}
      </div>

      {/* Existing Images Section */}
      <div>
        <label className="text-xs text-gray-700 block mb-2">
          Or Select from Existing Images
        </label>
        
        {loadingAssets ? (
          <p className="text-xs text-gray-500">Loading images...</p>
        ) : assets.length === 0 ? (
          <p className="text-xs text-gray-500">No images uploaded yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {assets.map((asset) => (
              <div
                key={asset._id}
                className="relative group"
              >
                <button
                  type="button"
                  onClick={() => handleSelectExisting(asset)}
                  className={`border rounded overflow-hidden transition-all w-full ${
                    cell.imageUrl === asset.url
                      ? "ring-2 ring-blue-600 border-blue-600"
                      : "border-gray-300 hover:ring-2 hover:ring-blue-400"
                  }`}
                  title={asset._id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt="Asset thumbnail"
                    className="w-full h-16 object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteAsset(asset._id, e)}
                  className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CellPropertiesPanelProps {
  cell: Cell;
  onUpdateCell: (cellId: string, updates: Partial<Cell>) => void;
  onClose: () => void;
}

export default function CellPropertiesPanel({
  cell,
  onUpdateCell,
  onClose,
}: CellPropertiesPanelProps) {
  const [localUpdates, setLocalUpdates] = useState<Partial<Cell>>({});

  const handleChange = (key: keyof Cell, value: any) => {
    setLocalUpdates({ ...localUpdates, [key]: value });
    onUpdateCell(cell.id, { [key]: value });
  };

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Cell Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">{/* Cell Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Cell Type</label>
            <select
              value={cell.type}
              onChange={(e) =>
                handleChange("type", e.target.value as "text" | "image")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
          </div>

          {/* Position and Size */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold text-sm mb-3">Position & Size</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-700">X (mm)</label>
                <input
                  type="number"
                  value={cell.x}
                  onChange={(e) => handleChange("x", parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700">Y (mm)</label>
                <input
                  type="number"
                  value={cell.y}
                  onChange={(e) => handleChange("y", parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700">Width (mm)</label>
                <input
                  type="number"
                  value={cell.width}
                  onChange={(e) =>
                    handleChange("width", parseFloat(e.target.value))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700">Height (mm)</label>
                <input
                  type="number"
                  value={cell.height}
                  onChange={(e) =>
                    handleChange("height", parseFloat(e.target.value))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Field Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cell.fieldName || ""}
              onChange={(e) => handleChange("fieldName", e.target.value)}
              placeholder="e.g., customerName"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required - Must be unique within the invoice
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Show in Invoice List
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={cell.showInList === true}
                onChange={(e) => handleChange("showInList", e.target.checked)}
                className="mr-2"
              />
              Display this field in the invoices list
            </label>
          </div>

          {/* Border Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2">Cell Borders</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={cell.borderTop !== false}
                  onChange={(e) => handleChange("borderTop", e.target.checked)}
                  className="mr-2"
                />
                Top
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={cell.borderRight === true}
                  onChange={(e) => handleChange("borderRight", e.target.checked)}
                  className="mr-2"
                />
                Right
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={cell.borderBottom === true}
                  onChange={(e) => handleChange("borderBottom", e.target.checked)}
                  className="mr-2"
                />
                Bottom
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={cell.borderLeft !== false}
                  onChange={(e) => handleChange("borderLeft", e.target.checked)}
                  className="mr-2"
                />
                Left
              </label>
            </div>
          </div>

          {/* Text Properties */}
          {cell.type === "text" && (
            <>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-sm mb-3">Text Properties</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-700">Content</label>
                    <textarea
                      value={cell.content || ""}
                      onChange={(e) => handleChange("content", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-700">Font Family</label>
                    <select
                      value={cell.fontFamily || "Arial"}
                      onChange={(e) =>
                        handleChange("fontFamily", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-700">Font Size</label>
                      <input
                        type="number"
                        value={cell.fontSize || 14}
                        onChange={(e) =>
                          handleChange("fontSize", parseInt(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-700">
                        Font Weight
                      </label>
                      <select
                        value={cell.fontWeight || "normal"}
                        onChange={(e) =>
                          handleChange("fontWeight", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700">
                      Text Alignment
                    </label>
                    <select
                      value={cell.textAlign || "left"}
                      onChange={(e) =>
                        handleChange("textAlign", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={cell.color || "#000000"}
                        onChange={(e) => handleChange("color", e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cell.color || "#000000"}
                        onChange={(e) => handleChange("color", e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Image Properties */}
          {cell.type === "image" && (
            <ImagePropertiesSection
              cell={cell}
              onUpdateCell={onUpdateCell}
            />
          )}
      </div>
    </div>
  );
}
