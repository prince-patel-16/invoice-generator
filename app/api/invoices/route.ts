import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const invoices = await Invoice.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Check if invoice number is provided and if it already exists
    if (body.invoiceNumber) {
      const existingInvoice = await Invoice.findOne({ invoiceNumber: body.invoiceNumber });
      if (existingInvoice) {
        return NextResponse.json(
          { success: false, error: `Invoice number ${body.invoiceNumber} already exists. Please use a different number.` },
          { status: 400 }
        );
      }
    }

    const invoice = new Invoice({
      invoiceNumber: body.invoiceNumber || undefined,
      cells: body.cells || [],
      templateId: body.templateId || null,
      templateName: body.templateName || null,
      saveAsTemplate: body.saveAsTemplate || false,
      backgroundImage: body.backgroundImage || "",
      showBorders: body.showBorders !== false,
    });

    await invoice.save();

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
