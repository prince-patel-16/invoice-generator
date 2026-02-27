import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ImageAsset from "@/lib/models/ImageAsset";

export const runtime = "nodejs";

const parseDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    return null;
  }
  return { mimeType: match[1], data: match[2] };
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const asset = await ImageAsset.findById(id);
    if (!asset) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const parsed = parseDataUrl(asset.imageData);
    if (!parsed) {
      return new NextResponse("Invalid image data", { status: 500 });
    }

    const buffer = Buffer.from(parsed.data, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": parsed.mimeType || asset.mimeType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
