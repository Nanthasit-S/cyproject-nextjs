// fixcy/components/ImageUploadModal.tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useState } from "react";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImageFile(e.target.files[0]);
      setImageUrl(""); // Clear URL input
    }
  };

  const handleUrlChange = (value: string) => {
    setImageUrl(value);
    setNewImageFile(null); // Clear file input
  };

  const handleSubmit = async () => {
    if (!newImageFile && !imageUrl) {
        alert("Please select a file or provide an image URL.");
        return;
    }
    setIsUploading(true);

    const formData = new FormData();
    if (newImageFile) {
        formData.append('image', newImageFile);
    } else {
        formData.append('imageUrl', imageUrl);
    }
    formData.append('altText', altText);
    
    try {
      await onUpload(formData);
      onClose(); // Close modal on success
      // Reset form
      setNewImageFile(null);
      setImageUrl("");
      setAltText("");
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="2xl">
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Upload New Image</ModalHeader>
          <ModalBody className="space-y-4">
            <Input 
                type="file" 
                label="Image File"
                onChange={handleFileChange} 
                accept="image/*" 
            />
            <p className="text-center text-sm text-default-500">OR</p>
            <Input 
                type="url" 
                label="Image URL"
                value={imageUrl} 
                onValueChange={handleUrlChange} 
                placeholder="https://example.com/image.jpg"
            />
             <Input
                fullWidth
                label="Alt Text"
                placeholder="Descriptive text for the image"
                value={altText}
                onValueChange={setAltText}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};