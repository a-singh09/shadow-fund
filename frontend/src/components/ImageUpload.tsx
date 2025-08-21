import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  uploadImageWithProgress,
  createImagePreview,
  compressImage,
} from "@/lib/ipfs";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageUploaded: (ipfsHash: string, url: string) => void;
  currentImage?: string;
  className?: string;
  disabled?: boolean;
}

const ImageUpload = ({
  onImageUploaded,
  currentImage,
  className = "",
  disabled = false,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || "");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Create preview
        const preview = await createImagePreview(file);
        setPreviewUrl(preview);

        // Compress image
        const compressedFile = await compressImage(file);

        // Upload to IPFS
        const result = await uploadImageWithProgress(
          compressedFile,
          (progress) => setUploadProgress(progress),
        );

        // Update parent component
        onImageUploaded(result.hash, result.url);
        setPreviewUrl(result.url);

        const isRealIPFS =
          result.url.includes("ipfs") && !result.hash.startsWith("MOCK-");

        toast({
          title: isRealIPFS
            ? "Image Uploaded to IPFS"
            : "Image Uploaded (Demo Mode)",
          description: isRealIPFS
            ? "Your image is now stored on the decentralized IPFS network"
            : "Using local preview - configure IPFS service for real storage",
        });
      } catch (error) {
        console.error("Image upload failed:", error);
        setPreviewUrl(currentImage || "");

        toast({
          title: "Upload Failed",
          description:
            error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [disabled, onImageUploaded, currentImage, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        handleFileSelect(imageFile);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
      }
    },
    [disabled, handleFileSelect, toast],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setDragActive(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleRemoveImage = useCallback(() => {
    if (disabled) return;

    setPreviewUrl("");
    onImageUploaded("", "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [disabled, onImageUploaded]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {previewUrl ? (
        // Image Preview
        <div className="relative group">
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-600">
            <img
              src={previewUrl}
              alt="Campaign preview"
              className="w-full h-full object-cover"
              onError={() => {
                console.error("Failed to load image:", previewUrl);
                setPreviewUrl("");
              }}
            />

            {/* Upload Progress Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <div className="text-sm">Uploading to IPFS...</div>
                  <div className="text-xs mt-1">{uploadProgress}%</div>
                  <div className="w-32 bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Remove Button */}
            {!disabled && !isUploading && (
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Success Indicator */}
            {!isUploading && previewUrl && previewUrl.includes("ipfs") && (
              <div className="absolute top-2 left-2 p-1 bg-green-500 text-white rounded-full">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Change Image Button */}
          {!disabled && !isUploading && (
            <button
              onClick={openFileDialog}
              className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <div className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                Change Image
              </div>
            </button>
          )}
        </div>
      ) : (
        // Upload Area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
          className={`
            w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
            ${
              dragActive
                ? "border-red-500 bg-red-500/10"
                : "border-gray-600 hover:border-gray-500"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${isUploading ? "pointer-events-none" : ""}
          `}
        >
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-400" />
                <div className="text-center">
                  <div className="text-sm font-medium text-white mb-1">
                    Uploading to IPFS...
                  </div>
                  <div className="text-xs">{uploadProgress}%</div>
                  <div className="w-32 bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-gray-800 rounded-full mb-4">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white mb-1">
                    Upload Campaign Image
                  </div>
                  <div className="text-xs">Drag & drop or click to select</div>
                  <div className="text-xs mt-1 text-gray-500">
                    PNG, JPG up to 5MB
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* IPFS Info */}
      {previewUrl && previewUrl.includes("ipfs") && !isUploading && (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <CheckCircle className="w-3 h-3 mr-1 text-green-400" />
          Stored on IPFS (decentralized storage)
        </div>
      )}

      {/* Mock Info */}
      {previewUrl && previewUrl.startsWith("data:") && !isUploading && (
        <div className="mt-2 text-xs text-yellow-500 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Demo mode - using local preview (configure IPFS for real storage)
        </div>
      )}

      {/* Error State */}
      {!previewUrl && !isUploading && currentImage && (
        <div className="mt-2 text-xs text-red-400 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed to load image
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
