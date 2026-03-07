# Upload-File Project Guide

A step-by-step guide to scaffold a file upload application using React Router v7, Cloudflare Workers, and R2 storage.

---

## Project Overview

**Project Name:** upload-file  
**Stack:** React Router v7 + Cloudflare Workers + R2 Storage  
**Purpose:** Learn how to build a file upload application with Cloudflare's ecosystem

---

## System Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│ Cloudflare   │────▶│     R2      │
│  (Upload)   │     │   Workers    │     │   Storage   │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Client     │
                   │  (Download)  │
                   └──────────────┘
```

---

## Step 1: Initialize Project

### 1.1 Install Prerequisites

| Tool | Command |
|------|---------|
| **Bun** | `powershell -ExecutionPolicy Bypass -c "irm bun.sh/install.ps1 \| iex"` |
| **Wrangler** | `bun add -g wrangler` |

### 1.2 Create React Router v7 Project

```bash
bunx create-react-router@latest upload-file --template cloudflare
cd upload-file
```

### 1.3 Install Dependencies

```bash
bun install
bun add react-dropzone papaparse clsx tailwind-merge lucide-react
```

---

## Step 2: Configure R2 Storage

### 2.1 Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Create bucket named: `upload-file-storage`

### 2.2 Update wrangler.jsonc

```jsonc
{
  "r2_buckets": [
    { "binding": "UPLOAD_BUCKET", "bucket_name": "upload-file-storage" }
  ]
}
```

### 2.3 Update Worker Types (workers/app.ts)

```typescript
export interface Env {
  UPLOAD_BUCKET: R2Bucket;
}
```

---

## Step 3: Build Application

### 3.1 Route Configuration (app/routes.ts)

```typescript
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/upload", "routes/upload.tsx"),
  route("/files/:filename", "routes/files.$filename.ts"),
] satisfies RouteConfig;
```

### 3.2 Upload Route (app/routes/upload.tsx)

Create a server action that handles file upload to R2:

```typescript
import type { ActionFunctionArgs } from "react-router";

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  if (!file) return Response.json({ error: "No file" }, { status: 400 });
  
  const buffer = new Uint8Array(await file.arrayBuffer());
  
  await context.cloudflare.env.UPLOAD_BUCKET.put(file.name, buffer, {
    httpMetadata: { contentType: file.type }
  });
  
  return Response.json({ success: true, url: `/files/${file.name}` });
}
```

### 3.3 File Serving Route (app/routes/files.\$filename.ts)

```typescript
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const file = await context.cloudflare.env.UPLOAD_BUCKET.get(params.filename!);
  
  if (!file) return new Response("Not found", { status: 404 });
  
  return new Response(file.body, {
    headers: { "Content-Type": file.httpMetadata?.contentType || "application/octet-stream" }
  });
}
```

### 3.4 Home Page with Upload UI (app/routes/home.tsx)

```typescript
import { useDropzone } from "react-dropzone";
import { useFetcher } from "react-router";

export default function Home() {
  const fetcher = useFetcher();
  
  const onDrop = (acceptedFiles: File[]) => {
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    fetcher.submit(formData, { method: "post", action: "/upload" });
  };
  
  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  
  return (
    <div {...getRootProps()} className="p-8 border-2 border-dashed">
      <input {...getInputProps()} />
      <p>Drag files here or click to upload</p>
      {fetcher.state === "submitting" && <p>Uploading...</p>}
    </div>
  );
}
```

---

## Step 4: Development & Deployment

### 4.1 Local Development

```bash
bun run dev
# Visit http://localhost:5173
```

### 4.2 Build

```bash
bun run build
```

### 4.3 Deploy

```bash
bun run deploy
```

---

## File Structure

```
upload-file/
├── app/
│   ├── routes/
│   │   ├── home.tsx          # Upload UI
│   │   ├── upload.tsx        # Upload action
│   │   └── files.$filename.ts # File serving
│   ├── lib/utils.ts
│   ├── root.tsx
│   └── app.css
├── workers/app.ts
├── wrangler.jsonc
├── package.json
└── vite.config.ts
```

---

## What NOT to Do

- ❌ Don't commit `.dev.vars` to git
- ❌ Don't store secrets in `wrangler.jsonc` (use secrets instead)
- ❌ Don't use Node.js-only packages that don't work in Workers
- ❌ Don't forget to add R2 binding before deploying

---

## Next Steps

1. Add file list view
2. Add delete functionality
3. Add file type validation
4. Set up custom domain
