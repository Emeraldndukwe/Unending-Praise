// Media optimization utilities
const MAX_IMAGE_SIZE = 1920; // Max width/height in pixels
const MAX_IMAGE_QUALITY = 0.85; // JPEG quality (0-1)
const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024; // 2MB max
const MAX_VIDEO_FILE_SIZE = 10 * 1024 * 1024; // 10MB max

export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      reject(new Error(`Image too large. Maximum size is ${MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          if (width > height) {
            height = (height * MAX_IMAGE_SIZE) / width;
            width = MAX_IMAGE_SIZE;
          } else {
            width = (width * MAX_IMAGE_SIZE) / height;
            height = MAX_IMAGE_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG for better compression (unless it's PNG with transparency)
        const isPng = file.type === 'image/png';
        const format = isPng ? 'image/png' : 'image/jpeg';
        const quality = isPng ? undefined : MAX_IMAGE_QUALITY;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const reader2 = new FileReader();
            reader2.onload = () => resolve(reader2.result as string);
            reader2.onerror = reject;
            reader2.readAsDataURL(blob);
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressVideo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_VIDEO_FILE_SIZE) {
      reject(new Error(`Video too large. Maximum size is ${MAX_VIDEO_FILE_SIZE / 1024 / 1024}MB`));
      return;
    }

    // For videos, we can't compress in browser easily, but we can check size
    // and provide a warning. Store as base64 but warn if large.
    if (file.size > 5 * 1024 * 1024) {
      console.warn(`Large video file (${(file.size / 1024 / 1024).toFixed(2)}MB). Consider compressing before upload.`);
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getFileSizeMB(file: File): number {
  return file.size / 1024 / 1024;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

