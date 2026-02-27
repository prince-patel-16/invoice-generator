import mongoose from "mongoose";

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

const invoiceTemplateSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

const InvoiceTemplate =
  mongoose.models.InvoiceTemplate ||
  mongoose.model("InvoiceTemplate", invoiceTemplateSchema);

export default InvoiceTemplate;
