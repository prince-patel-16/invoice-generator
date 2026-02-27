import connectDB from "@/lib/db";
import Configuration from "@/lib/models/Configuration";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid configuration ID" },
        { status: 400 }
      );
    }

    const configuration = await Configuration.findById(id);

    if (!configuration) {
      return NextResponse.json(
        { success: false, error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: configuration });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, cells, backgroundImage, showBorders } =
      await request.json();

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid configuration ID" },
        { status: 400 }
      );
    }

    const configuration = await Configuration.findByIdAndUpdate(
      id,
      { name, description, cells, backgroundImage, showBorders },
      { new: true }
    );

    if (!configuration) {
      return NextResponse.json(
        { success: false, error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: configuration });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid configuration ID" },
        { status: 400 }
      );
    }

    const configuration = await Configuration.findByIdAndDelete(id);

    if (!configuration) {
      return NextResponse.json(
        { success: false, error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: configuration });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
