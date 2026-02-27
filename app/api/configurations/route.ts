import connectDB from "@/lib/db";
import Configuration from "@/lib/models/Configuration";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const configurations = await Configuration.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: configurations });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { name, description, cells, backgroundImage, showBorders } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const configuration = new Configuration({
      name,
      description,
      cells,
      backgroundImage,
      showBorders,
    });

    await configuration.save();
    return NextResponse.json({ success: true, data: configuration });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
