'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import styles from './PhotoUpload.module.css';

interface PhotoUploadProps {
  label: string;
  sublabel: string;
  onFileSelect: (file: File) => void;
  previewUrl?: string | null;
}

export default function PhotoUpload({
  label,
  sublabel,
  onFileSelect,
  previewUrl,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className={styles.wrapper}>
      <div
        className={`upload-zone ${preview ? 'has-image' : ''} ${isDragging ? styles.dragging : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt={label} />
        ) : (
          <>
            <span className="upload-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <span className="upload-label">{label}</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          aria-label={`${label} 사진 업로드`}
        />
      </div>
      <p className={styles.sublabel}>{sublabel}</p>
      {preview && (
        <button
          className={styles.changeBtn}
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
        >
          다시 선택
        </button>
      )}
    </div>
  );
}
