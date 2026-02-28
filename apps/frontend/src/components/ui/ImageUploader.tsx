'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
}

interface ImageUploaderProps {
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  onUpload: (files: File[]) => Promise<UploadedImage[]>;
  onDelete?: (imageId: string) => Promise<void>;
  maxImages?: number;
  label?: string;
  hint?: string;
  className?: string;
}

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({
  value = [],
  onChange,
  onUpload,
  onDelete,
  maxImages = 8,
  label = 'Upload Images',
  hint,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (files: File[]): string | null => {
    if (value.length + files.length > maxImages) {
      return `Maximum ${maxImages} images allowed.`;
    }
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        return `Invalid file type: ${f.name}. Only JPEG, PNG, WebP allowed.`;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        return `File too large: ${f.name}. Max ${MAX_SIZE_MB} MB.`;
      }
    }
    return null;
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null);
      const err = validate(files);
      if (err) { setError(err); return; }
      setUploading(true);
      try {
        const uploaded = await onUpload(files);
        onChange?.([...value, ...uploaded]);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, onChange, onUpload],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) handleFiles(files);
    e.target.value = '';
  };

  const handleDelete = async (imageId: string) => {
    try {
      await onDelete?.(imageId);
      onChange?.(value.filter((img) => img.id !== imageId));
    } catch {
      setError('Delete failed.');
    }
  };

  const canUpload = value.length < maxImages && !uploading;

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="label-base">
          {label}
          <span className="text-slate-400 font-normal ms-1">
            ({value.length}/{maxImages})
          </span>
        </label>
      )}

      {/* Drop Zone */}
      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-10 px-4',
            dragOver
              ? 'border-brand-500 bg-brand-50'
              : 'border-slate-200 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50',
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin mb-2" />
          ) : (
            <Upload className={cn('h-8 w-8 mb-2', dragOver ? 'text-brand-600' : 'text-slate-400')} />
          )}
          <p className={cn('text-sm font-medium', dragOver ? 'text-brand-700' : 'text-slate-600')}>
            {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {hint ?? `JPEG, PNG, WebP — max ${MAX_SIZE_MB} MB each`}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleInputChange}
            className="sr-only"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001'}${img.url}`}
                alt={img.filename}
                className="w-full h-full object-cover"
              />
              {onDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {value.length < maxImages && !uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-all aspect-square text-slate-400 hover:text-brand-600"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs mt-1">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
