import { useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onCapture(file, url);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {preview && (
        <img
          src={preview}
          alt="Tatt bilde"
          className="w-full max-w-sm rounded-2xl shadow-lg object-cover aspect-square"
        />
      )}
      <button
        onClick={() => inputRef.current?.click()}
        className="bg-green-600 active:bg-green-700 text-white font-bold text-lg rounded-full px-8 py-4 shadow-lg flex items-center gap-3 transition-colors"
        aria-label="Ta bilde av en sommerfugl"
      >
        <span className="text-2xl">📷</span>
        {preview ? 'Ta nytt bilde' : 'Ta bilde av sommerfugl'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
