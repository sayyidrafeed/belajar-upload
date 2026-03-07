import type { ActionFunctionArgs } from "react-router";
import { isAllowedExtension, isAllowedImageType } from "../lib/utils";

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/heic"];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ["png", "jpeg", "jpg", "heic"];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    // Check if the request has form data
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return Response.json(
        { error: "Invalid content type. Expected multipart/form-data" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    // Check if file exists
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    // Validate file type (MIME type)
    if (!isAllowedImageType(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only PNG, JPEG, JPG, and HEIC are allowed." },
        { status: 400 },
      );
    }

    // Validate file extension as additional security
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(`.${ext}`));

    if (!hasValidExtension) {
      return Response.json(
        { error: "Invalid file extension. Only .png, .jpeg, .jpg, .heic are allowed." },
        { status: 400 },
      );
    }

    // Get the R2 bucket from context
    const env = context.cloudflare?.env as { UPLOAD_BUCKET?: R2Bucket };

    if (!env?.UPLOAD_BUCKET) {
      console.error("R2 bucket not configured");
      return Response.json({ error: "Storage configuration error" }, { status: 500 });
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename to prevent overwrites
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;

    // Upload to R2
    await env.UPLOAD_BUCKET.put(uniqueFileName, buffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return Response.json({
      success: true,
      url: `/files/${uniqueFileName}`,
      filename: uniqueFileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to upload file. Please try again." }, { status: 500 });
  }
}
