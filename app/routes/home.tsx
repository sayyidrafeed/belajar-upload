import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFetcher } from "react-router";
import { Upload, Image, FileIcon, CheckCircle, XCircle } from "lucide-react";
import { formatFileSize, isAllowedExtension, isAllowedImageType } from "../lib/utils";

export default function Home() {
  const fetcher = useFetcher<{ success?: boolean; error?: string; url?: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!isAllowedImageType(file.type) && !isAllowedExtension(file.name)) {
      setUploadError("Invalid file type. Only PNG, JPEG, JPG, and HEIC are allowed.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/heic": [".heic"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    fetcher.submit(formData, { method: "post", action: "/upload" });
  };

  // Handle fetcher state changes
  if (fetcher.state === "idle" && fetcher.data?.success && !uploadSuccess) {
    setUploadSuccess(true);
    setSelectedFile(null);
  }

  const isUploading = fetcher.state === "submitting";

  return (
    <main>
      <h1>Upload File</h1>
      <p>Upload PNG, JPEG, JPG, or HEIC images to Cloudflare R2</p>

      <div className="upload-container">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""} ${isDragReject ? "error" : ""}`}
        >
          <input {...getInputProps()} />
          {isDragActive && !isDragReject ? (
            <>
              <Upload className="dropzone-icon" />
              <p className="dropzone-text">Drop the file here...</p>
            </>
          ) : isDragReject ? (
            <>
              <XCircle className="dropzone-icon" style={{ color: "#ef4444" }} />
              <p className="dropzone-text">Invalid file type</p>
            </>
          ) : (
            <>
              <Upload className="dropzone-icon" />
              <p className="dropzone-text">Drag & drop an image here, or click to select</p>
              <p className="dropzone-hint">Click to browse files</p>
            </>
          )}
        </div>

        <p className="accepted-formats">Accepted formats: PNG, JPEG, JPG, HEIC</p>

        {selectedFile && (
          <div className="file-preview">
            <Image className="file-preview-icon" />
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="status-message error">
            <XCircle style={{ width: 16, height: 16, display: "inline", marginRight: 8 }} />
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="status-message success">
            <CheckCircle style={{ width: 16, height: 16, display: "inline", marginRight: 8 }} />
            File uploaded successfully!
          </div>
        )}

        {isUploading && (
          <div className="status-message loading">
            <Upload style={{ width: 16, height: 16, display: "inline", marginRight: 8 }} />
            Uploading...
          </div>
        )}

        {selectedFile && !isUploading && (
          <button className="upload-button" onClick={handleUpload} disabled={!selectedFile}>
            <Upload style={{ width: 20, height: 20 }} />
            Upload File
          </button>
        )}
      </div>

      <div className="files-list">
        <h2>Uploaded Files</h2>
        <div className="empty-state">
          <FileIcon style={{ width: 48, height: 48, margin: "0 auto", opacity: 0.5 }} />
          <p>No files uploaded yet</p>
        </div>
      </div>
    </main>
  );
}
