"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Template {
  _id: string;
  name: string;
  description?: string;
}

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
  onSkip: () => void;
}

export default function TemplateSelector({
  onSelect,
  onSkip,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get("/api/templates");
      setTemplates(response.data.data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Use a Template?</h2>
        <p className="text-gray-600 mb-6">
          Select a saved template to use as a starting point.
        </p>

        {loading ? (
          <p className="text-gray-500">Loading templates...</p>
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template._id}
                  onClick={() => onSelect(template._id)}
                  className="w-full text-left p-3 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition"
                >
                  <h3 className="font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500">{template.description}</p>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Start Fresh
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
