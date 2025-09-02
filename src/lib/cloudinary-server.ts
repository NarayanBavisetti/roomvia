import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryImage } from "./cloudinary";

// Configure Cloudinary (server-only)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const serverUploadToCloudinary = async (
  fileBuffer: Buffer,
  userId: string,
  listingId?: string,
  originalName?: string,
  mimeType: string = "image/jpeg"
): Promise<CloudinaryImage> => {
  try {
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Missing Cloudinary credentials. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
      );
    }

    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${fileBuffer.toString("base64")}`,
      {
        folder: `listings/${userId}/${listingId || "temp"}`,
        public_id: originalName
          ? `${Date.now()}-${originalName.split(".")[0]}`
          : undefined,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      }
    );

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      is_primary: false,
    };
  } catch (error) {
    const err = error as { http_code?: number; statusCode?: number; status?: number; message?: string; error?: { message?: string }; response?: { body?: { error?: { message?: string } } } };
    const httpCode = err?.http_code || err?.statusCode || err?.status;
    const cloudMessage =
      err?.message ||
      err?.error?.message ||
      err?.response?.body?.error?.message;
    console.error("Cloudinary upload error:", err);
    throw new Error(
      `Cloudinary upload failed${httpCode ? ` (HTTP ${httpCode})` : ""}: ${
        cloudMessage || "Unknown error"
      }`
    );
  }
};

export const deleteFromCloudinary = async (
  publicId: string
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    const err = error as { http_code?: number; statusCode?: number; status?: number; message?: string; error?: { message?: string }; response?: { body?: { error?: { message?: string } } } };
    const httpCode = err?.http_code || err?.statusCode || err?.status;
    const cloudMessage =
      err?.message ||
      err?.error?.message ||
      err?.response?.body?.error?.message;
    console.error("Cloudinary delete error:", err);
    throw new Error(
      `Cloudinary delete failed${httpCode ? ` (HTTP ${httpCode})` : ""}: ${
        cloudMessage || "Unknown error"
      }`
    );
  }
};

export default cloudinary;
