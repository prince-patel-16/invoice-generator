import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ImageAsset from "@/lib/models/ImageAsset";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { imageData, mimeType } = await req.json();

    // Calculate hash of image data
    const hash = crypto.createHash("sha256").update(imageData).digest("hex");

    // Check if image already exists
    let asset = await ImageAsset.findOne({ hash });

    if (!asset) {
      // Create new asset only if it doesn't exist
      asset = await ImageAsset.create({
        imageData,
        hash,
        mimeType: mimeType || "image/png",
        size: imageData.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: asset._id,
        hash: asset.hash,
        mimeType: asset.mimeType,
        imageData: asset.imageData,
        url: asset.imageData,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    await connectDB();
    // Get all non-deleted assets (metadata only)
    const assets = await ImageAsset.find({ deleted: { $ne: true } })
      .sort({ createdAt: -1 });

    const data = assets.map((asset) => ({
      _id: asset._id,
      hash: asset.hash,
      mimeType: asset.mimeType,
      size: asset.size,
      createdAt: asset.createdAt,
      imageData: asset.imageData,
        url: asset.imageData,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
