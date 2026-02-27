"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  MouseEvent as ReactMouseEvent,
} from "react";
import CellContextMenu from "./CellContextMenu";
import CellPropertiesPanel from "./CellPropertiesPanel";
import FormattingToolbar from "./FormattingToolbar";
import ImageCell from "./ImageCell";
import ImagePicker from "./ImagePicker";
import axios from "axios";

export interface Cell {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  fieldName: string;
  imageSrc?: string;
  imageUrl?: string;
  imageAssetId?: string;
  content?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  showInList?: boolean;
  showBorder?: boolean;
  borderTop?: boolean;
  borderRight?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
}

interface InvoiceBuilderProps {
  initialCells?: Cell[];
  initialBackgroundImage?: string;
  initialShowBorders?: boolean;
  initialInvoiceNumber?: number;
  invoiceId?: string;
  isEditing?: boolean;
}

const A4_WIDTH = 210; // mm
const A4_HEIGHT = 297; // mm

export default function InvoiceBuilder({
  initialCells = [],
  initialBackgroundImage = "",
  initialInvoiceNumber,
  invoiceId,
  isEditing = false,
}: InvoiceBuilderProps) {
  const [cells, setCells] = useState<Cell[]>(initialCells);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [focusedCellId, setFocusedCellId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cellId: string | null;
  } | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>(initialBackgroundImage);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const showBorders = true;
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initialInvoiceNumber ? String(initialInvoiceNumber) : "");
  const [invoiceNumberError, setInvoiceNumberError] = useState<string>("");
  const [checkingInvoiceNumber, setCheckingInvoiceNumber] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    type: "move" | "resize";
    cellId: string;
    startX: number;
    startY: number;
    startCell: Cell;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragRef.current;
      const container = containerRef.current;
      if (!dragState || !container) return;

      const rect = container.getBoundingClientRect();
      const mmPerPxX = A4_WIDTH / rect.width;
      const mmPerPxY = A4_HEIGHT / rect.height;
      const dxMm = (event.clientX - dragState.startX) * mmPerPxX;
      const dyMm = (event.clientY - dragState.startY) * mmPerPxY;

      if (dragState.type === "move") {
        setCells((prev) =>
          prev.map((cell) => {
            if (cell.id !== dragState.cellId) return cell;
            const maxX = Math.max(0, A4_WIDTH - cell.width);
            const maxY = Math.max(0, A4_HEIGHT - cell.height);
            let nextX = Math.min(Math.max(0, dragState.startCell.x + dxMm), maxX);
            let nextY = Math.min(Math.max(0, dragState.startCell.y + dyMm), maxY);
            
            // Check collision with other cells and snap to edges
            const snapThreshold = 2; // mm
            prev.forEach((otherCell) => {
              if (otherCell.id === cell.id) return;
              
              // Snap to right edge of other cell
              if (Math.abs(nextX - (otherCell.x + otherCell.width)) < snapThreshold &&
                  nextY < otherCell.y + otherCell.height && nextY + cell.height > otherCell.y) {
                nextX = otherCell.x + otherCell.width;
              }
              // Snap to left edge of other cell
              if (Math.abs((nextX + cell.width) - otherCell.x) < snapThreshold &&
                  nextY < otherCell.y + otherCell.height && nextY + cell.height > otherCell.y) {
                nextX = otherCell.x - cell.width;
              }
              // Snap to bottom edge of other cell
              if (Math.abs(nextY - (otherCell.y + otherCell.height)) < snapThreshold &&
                  nextX < otherCell.x + otherCell.width && nextX + cell.width > otherCell.x) {
                nextY = otherCell.y + otherCell.height;
              }
              // Snap to top edge of other cell
              if (Math.abs((nextY + cell.height) - otherCell.y) < snapThreshold &&
                  nextX < otherCell.x + otherCell.width && nextX + cell.width > otherCell.x) {
                nextY = otherCell.y - cell.height;
              }
            });
            
            // Prevent overlap - push cell away if overlapping
            let finalX = nextX;
            let finalY = nextY;
            let hasCollision = true;
            let iterations = 0;
            const maxIterations = 10;
            
            while (hasCollision && iterations < maxIterations) {
              hasCollision = false;
              iterations++;
              
              for (const otherCell of prev) {
                if (otherCell.id === cell.id) continue;
                
                const testCell = { ...cell, x: finalX, y: finalY };
                
                // Check if cells overlap
                if (!(testCell.x + testCell.width <= otherCell.x ||
                      testCell.x >= otherCell.x + otherCell.width ||
                      testCell.y + testCell.height <= otherCell.y ||
                      testCell.y >= otherCell.y + otherCell.height)) {
                  
                  hasCollision = true;
                  
                  // Calculate push direction based on movement
                  const overlapX = Math.min(testCell.x + testCell.width, otherCell.x + otherCell.width) - 
                                   Math.max(testCell.x, otherCell.x);
                  const overlapY = Math.min(testCell.y + testCell.height, otherCell.y + otherCell.height) - 
                                   Math.max(testCell.y, otherCell.y);
                  
                  // Push in direction with less overlap
                  if (overlapX < overlapY) {
                    if (dxMm > 0) {
                      finalX = otherCell.x - testCell.width;
                    } else {
                      finalX = otherCell.x + otherCell.width;
                    }
                  } else {
                    if (dyMm > 0) {
                      finalY = otherCell.y - testCell.height;
                    } else {
                      finalY = otherCell.y + otherCell.height;
                    }
                  }
                  
                  // Clamp to canvas bounds
                  finalX = Math.min(Math.max(0, finalX), maxX);
                  finalY = Math.min(Math.max(0, finalY), maxY);
                }
              }
            }
            
            return { ...cell, x: finalX, y: finalY };
          })
        );
      } else {
        setCells((prev) =>
          prev.map((cell) => {
            if (cell.id !== dragState.cellId) return cell;
            const minSize = 10;
            const maxWidth = Math.max(minSize, A4_WIDTH - dragState.startCell.x);
            const maxHeight = Math.max(minSize, A4_HEIGHT - dragState.startCell.y);
            const nextWidth = Math.min(
              Math.max(minSize, dragState.startCell.width + dxMm),
              maxWidth
            );
            const nextHeight = Math.min(
              Math.max(minSize, dragState.startCell.height + dyMm),
              maxHeight
            );
            return { ...cell, width: nextWidth, height: nextHeight };
          })
        );
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const configRes = await axios.get("/api/configurations");
        setConfigurations(configRes.data.data || []);
        
        // Fetch next invoice number for new invoices
        if (!isEditing && !initialInvoiceNumber) {
          const invoicesRes = await axios.get("/api/invoices");
          const invoices = invoicesRes.data.data || [];
          if (invoices.length > 0) {
            const maxInvoiceNumber = Math.max(...invoices.map((inv: any) => inv.invoiceNumber || 0));
            setInvoiceNumber(String(maxInvoiceNumber + 1));
          } else {
            setInvoiceNumber("10000");
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, [isEditing, initialInvoiceNumber]);

  const checkInvoiceNumberUniqueness = async (value: string) => {
    const num = parseInt(value.trim());
    if (isNaN(num) || num <= 0) {
      setInvoiceNumberError("Please enter a valid positive number");
      return false;
    }

    // Skip check if editing and number hasn't changed
    if (isEditing && initialInvoiceNumber && num === initialInvoiceNumber) {
      setInvoiceNumberError("");
      return true;
    }

    setCheckingInvoiceNumber(true);
    try {
      const response = await axios.get(`/api/invoices`);
      const invoices = response.data.data || [];
      const exists = invoices.some((inv: any) => inv.invoiceNumber === num && inv._id !== invoiceId);
      
      if (exists) {
        setInvoiceNumberError(`Invoice number ${num} already exists`);
        setCheckingInvoiceNumber(false);
        return false;
      }
      
      setInvoiceNumberError("");
      setCheckingInvoiceNumber(false);
      return true;
    } catch (error) {
      console.error("Failed to check invoice number:", error);
      setCheckingInvoiceNumber(false);
      return true; // Allow save on check error
    }
  };

  const handleInvoiceNumberChange = (value: string) => {
    setInvoiceNumber(value);
    setInvoiceNumberError("");
    
    if (value.trim()) {
      // Debounce check
      const timeoutId = setTimeout(() => {
        checkInvoiceNumberUniqueness(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const getNextCellPosition = useCallback(() => {
    if (cells.length === 0) {
      return { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT };
    }

    // Simple stacking: place new cells below existing ones
    const lastCell = cells[cells.length - 1];
    const newY = lastCell.y + lastCell.height;

    if (newY >= A4_HEIGHT) {
      // If no vertical space, place beside
      const rightmostX = Math.max(...cells.map((c) => c.x + c.width));
      return {
        x: rightmostX,
        y: 0,
        width: A4_WIDTH - rightmostX,
        height: A4_HEIGHT,
      };
    }

    return {
      x: 0,
      y: newY,
      width: A4_WIDTH,
      height: A4_HEIGHT - newY,
    };
  }, [cells]);

  const addCell = useCallback(() => {
    const newCell: Cell = {
      id: `cell-${Date.now()}`,
      type: "text",
      ...getNextCellPosition(),
      fieldName: `Field ${cells.length + 1}`,
      fontSize: 14,
      color: "#000000",
      fontFamily: "Arial",
      fontWeight: "normal",
      textAlign: "left",
      content: "",
      showBorder: true,
      borderTop: true,
      borderRight: false,
      borderBottom: false,
      borderLeft: true,
      imageUrl: undefined,
      imageSrc: undefined,
      imageAssetId: undefined,
    };

    setCells([...cells, newCell]);
  }, [cells, getNextCellPosition]);

  const handleCellContextMenu = (
    e: ReactMouseEvent<HTMLDivElement>,
    cellId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCellId(cellId);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      cellId,
    });
  };

  const handleContainerContextMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).className.includes("a4-container")) {
      setSelectedCellId(null);
      setContextMenu(null);
    }
  };

  const handleCellMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>,
    cell: Cell,
    action: "move" | "resize"
  ) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    setSelectedCellId(cell.id);
    dragRef.current = {
      type: action,
      cellId: cell.id,
      startX: event.clientX,
      startY: event.clientY,
      startCell: { ...cell },
    };
  };

  const handlePrint = () => {
    const printContent = document.querySelector('.a4-container');
    if (!printContent) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; }
            .a4-container {
              width: 210mm;
              height: 297mm;
              position: relative;
              background: white;
            }
            .invoice-cell {
              position: absolute;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              padding: 8px;
              box-sizing: border-box;
            }
            .cell-text { width: 100%; height: 100%; white-space: pre-wrap; }
            .resize-handle { display: none; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const updateCell = (cellId: string, updates: Partial<Cell>) => {
    setCells(
      cells.map((cell) => (cell.id === cellId ? { ...cell, ...updates } : cell))
    );
  };

  const deleteCell = (cellId: string) => {
    setCells(cells.filter((cell) => cell.id !== cellId));
    if (selectedCellId === cellId) {
      setSelectedCellId(null);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const addCellToDirection = (
    cellId: string,
    direction: "top" | "bottom" | "left" | "right"
  ) => {
    const cell = cells.find((c) => c.id === cellId);
    if (!cell) return;

    let newCell: Cell;

    switch (direction) {
      case "top":
        newCell = {
          id: `cell-${Date.now()}`,
          type: "text",
          x: cell.x,
          y: Math.max(0, cell.y - 30),
          width: cell.width,
          height: 30,
          fieldName: `Field ${cells.length + 1}`,
          fontSize: 14,
          color: "#000000",
          fontFamily: "Arial",
          fontWeight: "normal",
          textAlign: "left",
          content: "",
          showBorder: true,
          borderTop: true,
          borderRight: false,
          borderBottom: false,
          borderLeft: true,
      imageUrl: undefined,
      imageSrc: undefined,
      imageAssetId: undefined,
        };
        break;
      case "bottom":
        newCell = {
          id: `cell-${Date.now()}`,
          type: "text",
          x: cell.x,
          y: cell.y + cell.height,
          width: cell.width,
          height: 30,
          fieldName: `Field ${cells.length + 1}`,
          fontSize: 14,
          color: "#000000",
          fontFamily: "Arial",
          fontWeight: "normal",
          textAlign: "left",
          content: "",
          showBorder: true,
          borderTop: true,
          borderRight: false,
          borderBottom: false,
          borderLeft: true,
      imageUrl: undefined,
      imageSrc: undefined,
      imageAssetId: undefined,
        };
        break;
      case "left":
        newCell = {
          id: `cell-${Date.now()}`,
          type: "text",
          x: Math.max(0, cell.x - 40),
          y: cell.y,
          width: 40,
          height: cell.height,
          fieldName: `Field ${cells.length + 1}`,
          fontSize: 14,
          color: "#000000",
          fontFamily: "Arial",
          fontWeight: "normal",
          textAlign: "left",
          content: "",
          showBorder: true,
          borderTop: true,
          borderRight: false,
          borderBottom: false,
          borderLeft: true,
      imageUrl: undefined,
      imageSrc: undefined,
      imageAssetId: undefined,
        };
        break;
      case "right":
        newCell = {
          id: `cell-${Date.now()}`,
          type: "text",
          x: cell.x + cell.width,
          y: cell.y,
          width: 40,
          height: cell.height,
          fieldName: `Field ${cells.length + 1}`,
          fontSize: 14,
          color: "#000000",
          fontFamily: "Arial",
          fontWeight: "normal",
          textAlign: "left",
          content: "",
          showBorder: true,
          borderTop: true,
          borderRight: false,
          borderBottom: false,
          borderLeft: true,
      imageUrl: undefined,
      imageSrc: undefined,
      imageAssetId: undefined,
        };
        break;
    }

    setCells([...cells, newCell]);
    setContextMenu(null);
  };

  const handleSave = async () => {
    try {
      // Validate invoice number
      if (invoiceNumber.trim()) {
        const isValid = await checkInvoiceNumberUniqueness(invoiceNumber);
        if (!isValid) {
          return;
        }
      }

      const payload: any = {
        cells,
        backgroundImage,
        showBorders,
      };

      // Add invoice number if provided
      if (invoiceNumber.trim()) {
        payload.invoiceNumber = parseInt(invoiceNumber.trim());
      }

      if (isEditing && invoiceId) {
        await axios.put(`/api/invoices/${invoiceId}`, payload);
      } else {
        const response = await axios.post("/api/invoices", payload);
        if (!response.data.success) {
          setInvoiceNumberError(response.data.error || "Failed to save invoice");
          return;
        }
      }

      alert("Invoice saved successfully!");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Failed to save invoice:", error);
      if (error.response?.data?.error) {
        setInvoiceNumberError(error.response.data.error);
      } else {
        alert("Failed to save invoice");
      }
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      if (!configName.trim()) {
        alert("Please enter a configuration name");
        return;
      }

      await axios.post("/api/configurations", {
        name: configName,
        description: configDescription,
        cells,
        backgroundImage,
        showBorders,
      });

      alert("Configuration saved successfully!");
      setConfigName("");
      setConfigDescription("");
      setShowConfigPanel(false);

      // Reload configurations
      const res = await axios.get("/api/configurations");
      setConfigurations(res.data.data || []);
    } catch (error) {
      console.error("Failed to save configuration:", error);
      alert("Failed to save configuration");
    }
  };

  const handleLoadConfiguration = async (configId: string) => {
    try {
      const response = await axios.get(`/api/configurations/${configId}`);
      const config = response.data.data;
      setCells(config.cells || []);
      setBackgroundImage(config.backgroundImage || "");
      alert("Configuration loaded successfully!");
    } catch (error) {
      console.error("Failed to load configuration:", error);
      alert("Failed to load configuration");
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    try {
      if (!confirm("Are you sure you want to delete this configuration?")) return;
      
      await axios.delete(`/api/configurations/${configId}`);
      alert("Configuration deleted successfully!");

      // Reload configurations
      const res = await axios.get("/api/configurations");
      setConfigurations(res.data.data || []);
    } catch (error) {
      console.error("Failed to delete configuration:", error);
      alert("Failed to delete configuration");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = "/"}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* A4 Canvas Container */}
            <div
              className="flex justify-center items-start"
              style={{
                perspective: "1000px",
              }}
            >
              <div
                ref={containerRef}
                className="a4-container relative"
                style={{
                  width: `${A4_WIDTH}mm`,
                  height: `${A4_HEIGHT}mm`,
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  border: "1px solid black",
                }}
                onContextMenu={handleContainerContextMenu}
              >
                {cells.length === 0 ? (
                  <button
                    onClick={addCell}
                    className="add-cell-btn"
                  >
                    + Add Cell
                  </button>
                ) : (
                  cells.map((cell) => {
                    console.log("🚀 ~ InvoiceBuilder ~ cell:", cell)
                    return <div
                      key={cell.id}
                      className={`invoice-cell ${
                        selectedCellId === cell.id ? "selected" : ""
                      }`}
                      style={{
                        left: `${cell.x}mm`,
                        top: `${cell.y}mm`,
                        width: `${cell.width}mm`,
                        height: `${cell.height}mm`,
                        fontSize: `${cell.fontSize}px`,
                        color: cell.color,
                        fontFamily: cell.fontFamily,
                        fontWeight: cell.fontWeight,
                        textAlign: cell.textAlign as any,
                        padding: "8px",
                        borderLeft: (showBorders && cell.borderLeft !== false) ? "1px solid black" : "none",
                        borderTop: (showBorders && cell.borderTop !== false) ? "1px solid black" : "none",
                        borderRight: (showBorders && cell.borderRight === true) ? "1px solid black" : "none",
                        borderBottom: (showBorders && cell.borderBottom === true) ? "1px solid black" : "none",
                      }}
                      onMouseDown={(e) => handleCellMouseDown(e, cell, "move")}
                      onClick={() => setSelectedCellId(cell.id)}
                      onContextMenu={(e) => handleCellContextMenu(e, cell.id)}
                    >
                      {cell.type === "text" ? (
                        <div style={{ position: "relative" }}>
                          {focusedCellId === cell.id && (
                            <FormattingToolbar
                              onFormat={handleFormat}
                            />
                          )}
                          <div
                            className="cell-text"
                            contentEditable
                            suppressContentEditableWarning
                            data-placeholder={cell.fieldName || "Text"}
                            onMouseDown={(e) => e.stopPropagation()}
                            onFocus={() => setFocusedCellId(cell.id)}
                            onBlur={(e) => {
                              setFocusedCellId(null);
                              updateCell(cell.id, {
                                content: e.currentTarget.innerHTML || "",
                              });
                            }}
                            dangerouslySetInnerHTML={{ __html: cell.content || "" }}
                          />
                        </div>
                      ) : (
                        <ImageCell
                          imageUrl={cell.imageUrl}
                          imageSrc={cell.imageSrc}
                          alt="Cell content"
                          style={{ maxWidth: "100%", maxHeight: "100%" }}
                        />
                      )}
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleCellMouseDown(e, cell, "resize")}
                      />
                    </div>;
                  })
                )}

                {/* Removed bottom-right add cell button */}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white rounded-lg shadow p-4 h-fit sticky top-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-800"
                >
                  Print
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Image
                </label>
                <ImagePicker
                  label="Upload background"
                  value={backgroundImage}
                  onChange={(url) => setBackgroundImage(url)}
                />
                {backgroundImage && (
                  <button
                    onClick={() => setBackgroundImage("")}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    Remove Background
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                  placeholder={isEditing ? "Invoice number" : "Auto-generated if left empty"}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  disabled={checkingInvoiceNumber}
                />
                {checkingInvoiceNumber && (
                  <p className="mt-1 text-xs text-blue-600">Checking availability...</p>
                )}
                {invoiceNumberError && (
                  <p className="mt-1 text-xs text-red-600">{invoiceNumberError}</p>
                )}
                {!invoiceNumberError && invoiceNumber && !checkingInvoiceNumber && (
                  <p className="mt-1 text-xs text-green-600">✓ Number available</p>
                )}
                {!isEditing && (
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for auto-increment
                  </p>
                )}
              </div>

              {/* Configuration Management */}
              <div className="border-t pt-4 space-y-3">
                <button
                  onClick={() => setShowConfigPanel(!showConfigPanel)}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  {showConfigPanel ? "Hide" : "Save"} Configuration
                </button>

                {showConfigPanel && (
                  <div className="border rounded p-3 bg-gray-50 space-y-2">
                    <input
                      type="text"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      placeholder="Configuration name"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                    />
                    <textarea
                      value={configDescription}
                      onChange={(e) => setConfigDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                      rows={2}
                    />
                    <button
                      onClick={handleSaveConfiguration}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Save Configuration
                    </button>
                  </div>
                )}

                {configurations.length > 0 && (
                  <div className="border rounded p-3 bg-gray-50 space-y-2 max-h-40 overflow-y-auto">
                    <h3 className="text-xs font-semibold">Saved Configurations</h3>
                    {configurations.map((config) => (
                      <div key={config._id} className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => handleLoadConfiguration(config._id)}
                          className="text-blue-600 hover:underline flex-1 text-left"
                        >
                          {config.name}
                        </button>
                        <button
                          onClick={() => handleDeleteConfiguration(config._id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedCellId && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    {showPropertiesPanel ? "Hide" : "Show"} Properties
                  </button>
                </div>
              )}

              {/* Properties Panel */}
              {showPropertiesPanel && selectedCellId && (
                <CellPropertiesPanel
                  cell={cells.find((c) => c.id === selectedCellId)!}
                  onUpdateCell={updateCell}
                  onClose={() => setShowPropertiesPanel(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CellContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          cellId={contextMenu.cellId || ""}
          onDelete={() => {
            if (contextMenu.cellId) deleteCell(contextMenu.cellId);
            setContextMenu(null);
          }}
          onAddCellToDirection={(direction) => {
            if (contextMenu.cellId)
              addCellToDirection(contextMenu.cellId, direction);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
