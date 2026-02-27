import mongoose from "mongoose";

const imageAssetSchema = new mongoose.Schema(
  {
    imageData: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mimeType: {
      type: String,
      default: "image/png",
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ImageAsset =
  mongoose.models.ImageAsset ||
  mongoose.model("ImageAsset", imageAssetSchema);

export default ImageAsset;
