import type { LoaderFunctionArgs } from "react-router";

// Allowed file extensions for serving
const ALLOWED_EXTENSIONS = ["png", "jpeg", "jpg", "heic"];

// MIME type mapping
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    heic: "image/heic",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  try {
    const filename = params.filename;

    // Validate filename
    if (!filename) {
      return new Response("Filename is required", { status: 400 });
    }

    // Security check: prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new Response("Invalid filename", { status: 400 });
    }

    // Validate file extension
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      filename.toLowerCase().endsWith(`.${ext}`),
    );

    if (!hasValidExtension) {
      return new Response("Invalid file type", { status: 403 });
    }

    // Get the R2 bucket from context
    const env = context.cloudflare?.env as { UPLOAD_BUCKET?: R2Bucket };

    if (!env?.UPLOAD_BUCKET) {
      console.error("R2 bucket not configured");
      return new Response("Storage not configured", { status: 500 });
    }

    // Get file from R2
    const file = await env.UPLOAD_BUCKET.get(filename);

    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set("Content-Type", file.httpMetadata?.contentType || getContentType(filename));
    headers.set("Content-Length", file.size.toString());
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("Content-Disposition", `inline; filename="${filename}"`);

    // Return the file with appropriate headers
    return new Response(file.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
