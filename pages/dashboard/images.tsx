// forgm/pages/dashboard/images.tsx
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Image as HeroImage } from "@heroui/image";
import { Link } from "@heroui/link";

interface UserProfile {
  displayName: string;
  pictureUrl: string;
  role: 'admin' | 'user';
}

interface SlideImage {
  id: number;
  image_url: string;
  alt_text?: string;
  link_url?: string;
}

interface DashboardProps {
  user: UserProfile;
  initialImages: SlideImage[];
}

export default function ImageDashboardPage({ user, initialImages }: DashboardProps) {
  const [images, setImages] = useState<SlideImage[]>(initialImages);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage) return alert('Please select an image file.');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('image', newImage);
    formData.append('altText', altText);
    formData.append('linkUrl', linkUrl);

    try {
      const response = await fetch('/api/admin/slider', { method: 'POST', body: formData });
      if (!response.ok) throw new Error((await response.json()).message || 'Upload failed');
      const updatedImages = await (await fetch('/api/slider-images')).json();
      setImages(updatedImages);
      setNewImage(null);
      setAltText('');
      setLinkUrl('');
      (document.getElementById('image-upload') as HTMLInputElement).value = '';
      alert('Image uploaded!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, imageUrl: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const response = await fetch(`/api/admin/slider?id=${id}&imageUrl=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      setImages(images.filter(img => img.id !== id));
      alert('Image deleted!');
    } catch (error) {
      alert('Error deleting image.');
    }
  };

  return (
    <DefaultLayout>
      <h1 className={title({ class: "mb-8" })}>Image Slider Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Upload New Image</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input type="file" label="Image File" id="image-upload" onChange={handleFileChange} isRequired accept="image/*" />
              <Input type="text" label="Alt Text" value={altText} onValueChange={setAltText} placeholder="Descriptive text" />
              <Input type="url" label="Link URL (Optional)" value={linkUrl} onValueChange={setLinkUrl} placeholder="https://example.com" />
              <Button type="submit" color="primary" disabled={isSubmitting} fullWidth>
                {isSubmitting ? 'Uploading...' : 'Upload Image'}
              </Button>
            </form>
          </Card>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Current Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <Card key={image.id} isPressable isHoverable>
                <CardBody className="overflow-visible p-0">
                  <HeroImage isZoomed width="100%" height={140} src={image.image_url} alt={image.alt_text || ''} className="w-full object-cover h-[140px]" />
                </CardBody>
                <CardFooter className="text-small justify-between">
                  <div className='flex-grow mr-2'>
                    <b>{image.alt_text || "No Alt Text"}</b>
                    {image.link_url && <p className="text-default-500 truncate"><Link href={image.link_url} isExternal size="sm">{image.link_url}</Link></p>}
                  </div>
                  <Button isIconOnly color="danger" variant="light" size="sm" onPress={() => handleDelete(image.id, image.image_url)} aria-label="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {images.length === 0 && <p className="mt-4 text-center text-default-500">No images uploaded yet.</p>}
        </div>
      </div>
    </DefaultLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { auth_token } = context.req.cookies;
  if (!auth_token) return { redirect: { destination: '/', permanent: false } };
  try {
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET!) as UserProfile;
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