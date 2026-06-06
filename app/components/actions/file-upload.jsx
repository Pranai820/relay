"use client";

import { Loader2, Paperclip, X } from "lucide-react";
import { useState } from "react";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploadField({ files, onChange, label = "Attachments" }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handlePick(event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    if (!picked.length) return;

    setUploading(true);
    setError("");
    try {
      const next = [...files];
      for (const file of picked) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Upload failed.");
        next.push(data.file);
      }
      onChange(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(uploadId) {
    setError("");
    try {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });
      onChange(files.filter((f) => f.id !== uploadId));
    } catch {
      onChange(files.filter((f) => f.id !== uploadId));
    }
  }

  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="file-upload">
      <span className="label">{label}</span>
      <div className="file-upload-row">
        <label className="btn">
          {uploading ? <Loader2 size={14} className="spin" /> : <Paperclip size={14} />}
          Add file
          <input type="file" multiple hidden onChange={handlePick} disabled={uploading} />
        </label>
        <span className="file-upload-hint">Max 25 MB total · deleted after send</span>
      </div>
      {error && <p className="file-upload-error">{error}</p>}
      {files.length > 0 && (
        <ul className="file-upload-list">
          {files.map((file) => (
            <li key={file.id}>
              <span>{file.name}</span>
              <span className="muted">{formatSize(file.size)}</span>
              <button type="button" className="icon-btn" onClick={() => removeFile(file.id)} aria-label="Remove">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {totalSize > 0 && <p className="muted">Total: {formatSize(totalSize)}</p>}
    </div>
  );
}
