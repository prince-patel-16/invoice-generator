import mongoose from "mongoose";

export interface ICell {
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

const cellSchema = new mongoose.Schema({
  id: String,
  type: {
    type: String,
    enum: ["text", "image"],
    default: "text",
  },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  fontSize: Number,
  color: String,
  fieldName: { type: String, required: true },
  imageSrc: String,
  imageUrl: String,
  imageAssetId: String,
  content: String,
  fontFamily: String,
  fontWeight: String,
  textAlign: String,
  showInList: Boolean,
  showBorder: Boolean,
  borderTop: Boolean,
  borderRight: Boolean,
  borderBottom: Boolean,
  borderLeft: Boolean,
});

const configurationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    cells: [cellSchema],
    backgroundImage: String,
    showBorders: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Configuration =
  mongoose.models.Configuration ||
  mongoose.model("Configuration", configurationSchema);

export default Configuration;
