import mongoose from "mongoose";

export interface ILibraryImage {
  name: string;
  description?: string;
  data: string; // Base64 encoded image
  mimeType: string;
  size: number; // In bytes
  category?: string;
}

const imageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    data: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: "image/png",
    },
    size: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
  },
  {
    timestamps: true,
  }
);

const ImageLibrary =
  mongoose.models.ImageLibrary ||
  mongoose.model("ImageLibrary", imageSchema);

export default ImageLibrary;
