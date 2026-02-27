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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: Number,
      unique: true,
      sparse: true,
    },
    templateId: mongoose.Schema.Types.ObjectId,
    cells: [cellSchema],
    templateName: String,
    saveAsTemplate: Boolean,
    backgroundImage: String,
    showBorders: {
      type: Boolean,
      default: true,
    },
    configurationId: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

// Auto-increment invoice number only if not provided
invoiceSchema.pre("save", async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const InvoiceModel = this.constructor as mongoose.Model<any>;
    const lastInvoice = await InvoiceModel.findOne({ invoiceNumber: { $exists: true } }).sort({ invoiceNumber: -1 });
    this.invoiceNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 10000;
  }
  next();
});

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
