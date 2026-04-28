'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: 'square' | 'wide';
}

const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUpload({ value, onChange, label, aspect = 'wide' }: ImageUploadProps) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error(t('menu.upload.notImage'));
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('menu.upload.tooBig'));
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      onChange(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('menu.upload.failed');
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const aspectClass = aspect === 'square' ? 'aspect-square max-w-[160px]' : 'h-36';

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-ink/80">{label}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
      {value ? (
        <div className={cn('relative w-full overflow-hidden rounded-xl border border-black/10 bg-white', aspectClass)}>
          <Image
            src={value}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            unoptimized
          />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-medium shadow-soft hover:bg-white"
              disabled={uploading}
            >
              {uploading ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              ) : (
                t('menu.fields.imageChange')
              )}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-lg bg-white/95 p-1.5 text-red-600 shadow-soft hover:bg-white"
              aria-label={t('menu.fields.imageRemove')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'grid w-full place-items-center rounded-xl border-2 border-dashed bg-white/40 transition-colors',
            aspectClass,
            dragOver ? 'border-ink bg-paper' : 'border-black/15 hover:bg-black/5',
            uploading && 'opacity-60'
          )}
          disabled={uploading}
        >
          <div className="flex flex-col items-center gap-2 text-ink/60">
            {uploading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            ) : (
              <Upload size={18} />
            )}
            <span className="px-3 text-center text-xs">{t('menu.fields.imageDrop')}</span>
          </div>
        </button>
      )}
    </div>
  );
}
