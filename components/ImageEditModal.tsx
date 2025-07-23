// fixcy/components/ImageEditModal.tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Image } from "@heroui/image";
import { useState, useEffect } from "react";

interface SlideImage {
  id: number;
  image_url: string;
  alt_text?: string;
}

interface ImageEditModalProps {
  image: SlideImage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<any>; // เปลี่ยน onSave ให้รับ FormData
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({ image, isOpen, onClose, onSave }) => {
  const [altText, setAltText] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (image) {
      setAltText(image.alt_text || "");
      setPreviewUrl(image.image_url);
    }
    // รีเซ็ตฟอร์มเมื่อปิด Modal
    if (!isOpen) {
        setNewImageFile(null);
        setNewImageUrl("");
        setPreviewUrl(null);
    }
  }, [image, isOpen]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setNewImageUrl(""); // clear url input
      setPreviewUrl(URL.createObjectURL(file)); // show preview
    }
  };
  
  const handleUrlChange = (value: string) => {
    setNewImageUrl(value);
    setNewImageFile(null); // clear file input
    setPreviewUrl(value); // show preview from url
  };

  const handleSave = async () => {
    if (!image) return;
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('id', image.id.toString());
    formData.append('altText', altText);

    if (newImageFile) {
        formData.append('image', newImageFile);
    } else if (newImageUrl) {
        formData.append('imageUrl', newImageUrl);
    }
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save image details", error);
      alert("Error saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!image) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="2xl">
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Edit Image Details</ModalHeader>
          <ModalBody>
            {previewUrl && (
                <Image
                    width={400}
                    height={200}
                    src={previewUrl}
                    alt="Preview"
                    className="w-full object-cover h-[200px] mb-4 rounded-lg"
                />
            )}
            <div className="space-y-4">
                <Input
                    fullWidth
                    label="Alt Text"
                    placeholder="Descriptive text for the image"
                    value={altText}
                    onValueChange={setAltText}
                />
                 <p className="text-center text-sm text-default-500">- Change Image (Optional) -</p>
                <Input 
                    type="file" 
                    label="New Image File"
                    onChange={handleFileChange} 
                    accept="image/*" 
                />
                <Input 
                    type="url" 
                    label="New Image URL"
                    value={newImageUrl} 
                    onValueChange={handleUrlChange} 
                    placeholder="https://example.com/new_image.jpg"
                />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};