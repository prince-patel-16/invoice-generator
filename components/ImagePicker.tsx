"use client";

import { useEffect, useState } from "react";

interface ImageAsset {
  _id: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

interface ImagePickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

export default function ImagePicker({
  label,
  value,
  onChange,
}: ImagePickerProps) {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const response = await fetch("/api/image-assets");
        const result = await response.json();
        if (result.success) {
          setAssets(result.data || []);
        }
      } catch (error) {
        console.error("Failed to load image assets:", error);
      }
    };

    loadAssets();
  }, []);

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
            onChange(result.data.url);
            // Refresh asset list
            const listResponse = await fetch("/api/image-assets");
            const listResult = await listResponse.json();
            if (listResult.success) {
              setAssets(listResult.data || []);
            }
          } else {
            console.error("Failed to upload image:", result.error);
          }
        } catch (error) {
          console.error("Error uploading image:", error);
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

  return (
    <div>
      <label className="text-xs text-gray-700 block mb-2">{label}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUpload(file);
          }
        }}
        className="w-full text-sm"
      />
      {loading && (
        <p className="text-xs text-blue-600 mt-2">Uploading...</p>
      )}

      {assets.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-2">Or pick existing</p>
          <div className="grid grid-cols-4 gap-2">
            {assets.map((asset) => (
              <button
                key={asset._id}
                type="button"
                onClick={() => onChange(asset.url)}
                className={`border rounded overflow-hidden hover:ring-2 hover:ring-blue-500 ${
                  value === asset.url ? "ring-2 ring-blue-600" : ""
                }`}
                title={asset._id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt="Asset"
                  className="w-full h-16 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
