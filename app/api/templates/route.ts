import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import InvoiceTemplate from "@/lib/models/InvoiceTemplate";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const templates = await InvoiceTemplate.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: templates });
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

    const template = new InvoiceTemplate({
      name: body.name,
      description: body.description || "",
      cells: body.cells || [],
      backgroundImage: body.backgroundImage || "",
      showBorders: body.showBorders !== false,
    });

    await template.save();

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
