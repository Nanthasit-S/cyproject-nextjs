// fixcy/pages/admin/images.tsx
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Image as HeroImage } from "@heroui/image";
import { ImageEditModal } from '@/components/ImageEditModal';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { useNotification } from '@/lib/NotificationContext';

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14m-7-7h14"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;

interface UserProfile {
  displayName: string;
  pictureUrl: string;
  role: 'admin' | 'user';
}

interface SlideImage {
  id: number;
  image_url: string;
  alt_text?: string;
}

interface DashboardProps {
  user: UserProfile;
  initialImages: SlideImage[];
}

export default function ImageDashboardPage({ user, initialImages }: DashboardProps) {
  const { showNotification } = useNotification();
  const [images, setImages] = useState<SlideImage[]>(initialImages);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<SlideImage | null>(null);

  const handleUpload = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/slider', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error((await response.json()).message || 'Upload failed');
      
      const updatedImages = await (await fetch('/api/slider-images')).json();
      setImages(updatedImages);
      showNotification('Success', 'Image uploaded successfully!', 'success');
    } catch (error: any) {
      showNotification('Error', `Upload Error: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleEdit = async (formData: FormData) => {
    const response = await fetch(`/api/admin/slider-update`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Update failed');

    setImages(images.map(img => img.id === result.updatedImage.id ? result.updatedImage : img));
    showNotification('Success', 'Changes saved successfully!', 'success');
  };

  const handleDelete = async (e: React.MouseEvent, id: number, imageUrl: string) => {
    e.stopPropagation(); 
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/admin/slider?id=${id}&imageUrl=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      setImages(images.filter(img => img.id !== id));
      showNotification('Success', 'Image deleted successfully!', 'success');
    } catch (error) {
      showNotification('Error', 'Error deleting image.', 'error');
    }
  };

  const openEditModal = (image: SlideImage) => {
    setEditingImage(image);
    setIsEditModalOpen(true);
  };

  return (
    <DefaultLayout>
        <div className="mb-10">
            <h1 className={title()}>Image Slider Management</h1>
            <p className={subtitle({ class: "!w-full mt-2" })}>Add, edit, or remove images from the homepage slider.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Card isPressable isHoverable onPress={() => setIsUploadModalOpen(true)} className="aspect-square flex items-center justify-center bg-default-100 hover:bg-default-200">
                <div className="text-center text-default-500">
                    <PlusIcon />
                    <p className="mt-2 font-semibold">Add New Image</p>
                </div>
            </Card>

            {images.map((image) => (
              <div key={image.id} className="card-container rounded-2xl">
                <Card className="w-full h-full aspect-square">
                    <HeroImage removeWrapper src={image.image_url} alt={image.alt_text || 'Slider Image'} className="w-full h-full object-cover" />
                </Card>
                <div className="card-overlay">
                    <p className="text-lg font-bold mb-4 px-2 text-center">{image.alt_text || "No Alt Text"}</p>
                    <div className="flex gap-4">
                        <Button color="primary" variant="solid" onPress={() => openEditModal(image)}><EditIcon /> Edit</Button>
                        <Button color="danger" variant="solid" onClick={(e) => handleDelete(e, image.id, image.image_url)}><DeleteIcon/> Delete</Button>
                    </div>
                </div>
              </div>
            ))}
        </div>

        <ImageUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleUpload} />
       <ImageEditModal image={editingImage} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleEdit} />
    </DefaultLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { auth_token } = context.req.cookies;
    if (!auth_token) return { redirect: { destination: '/', permanent: false } };
    try {
      const decoded = jwt.verify(auth_token, process.env.JWT_SECRET!) as unknown as UserProfile;
      if (decoded.role !== 'admin') return { redirect: { destination: '/profile', permanent: false } };
      
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `https://${context.req.headers.host}/api/slider-images` 
        : 'http://localhost:3000/api/slider-images';
  
      const res = await fetch(apiUrl);
      const initialImages = res.ok ? await res.json() : [];
      return { props: { user: decoded, initialImages } };
    } catch (error) {
      return { redirect: { destination: '/', permanent: false } };
    }
};