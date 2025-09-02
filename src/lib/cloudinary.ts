// Note: This file exposes client-friendly utilities only. Server SDK is in cloudinary-server.ts

export interface CloudinaryImage {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  is_primary: boolean;
}

export interface UploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

// Client-side upload function using unsigned upload presets
export const uploadToCloudinary = async (
  file: File,
  userId: string,
  listingId?: string,
  onProgress?: (progress: number) => void
): Promise<CloudinaryImage> => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      reject(new Error("Cloudinary cloud name not configured"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "roomvia_listings"); // You'll need to create this unsigned preset in Cloudinary
    formData.append("folder", `listings/${userId}/${listingId || "temp"}`);
    formData.append("resource_type", "image");
    formData.append("quality", "auto");
    formData.append("format", "auto");

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const result: UploadResult = JSON.parse(xhr.responseText);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            is_primary: false,
          });
        } catch {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed - network error"));
    });

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    );
    xhr.send(formData);
  });
};

// Generate optimized image URL with transformations
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";

  const {
    width = 800,
    height = 600,
    crop = "fill",
    quality = "auto",
    format = "auto",
  } = options;

  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
};

// Validate file before upload
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are allowed",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Image size must be less than 5MB",
    };
  }

  return { valid: true };
};

