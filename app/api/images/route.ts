import connectDB from "@/lib/db";
import ImageLibrary from "@/lib/models/ImageLibrary";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    let query: Record<string, any> = {};
    if (category) {
      query.category = category;
    }

    const images = await ImageLibrary.find(query).sort({ createdAt: -1 });
    
    // Don't send base64 data in list endpoint for efficiency
    const imagesList = images.map((img) => ({
      _id: img._id,
      name: img.name,
      description: img.description,
      mimeType: img.mimeType,
      size: img.size,
      category: img.category,
      createdAt: img.createdAt,
    }));

    return NextResponse.json({ success: true, data: imagesList });
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
    const { name, description, data, mimeType, category } =
      await request.json();

    if (!name || !data || !mimeType) {
      return NextResponse.json(
        { success: false, error: "Name, data, and mimeType are required" },
        { status: 400 }
      );
    }

    const size = Buffer.byteLength(data, "utf8");

    const image = new ImageLibrary({
      name,
      description,
      data,
      mimeType,
      size,
      category: category || "General",
    });

    await image.save();

    // Return without base64 data
    const response = {
      _id: image._id,
      name: image.name,
      description: image.description,
      mimeType: image.mimeType,
      size: image.size,
      category: image.category,
      createdAt: image.createdAt,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
