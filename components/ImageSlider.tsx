// forgm/components/ImageSlider.tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface SlideImage {
  id: number;
  image_url: string;
  alt_text?: string;
  link_url?: string;
}

interface ImageSliderProps {
  images: SlideImage[];
}

export const ImageSlider: React.FC<ImageSliderProps> = ({ images }) => {
  return (
    <div className="w-full h-96 mb-8 rounded-lg overflow-hidden">
        <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            className="h-full"
        >
            {images.map((image, index) => ( // Added index for priority
            <SwiperSlide key={image.id}>
                <div className="relative w-full h-full">
                <Image
                    src={image.image_url}
                    alt={image.alt_text || 'Slider Image'}
                    fill // Use fill instead of layout="fill"
                    style={{ objectFit: 'cover' }} // Use style prop for object-fit
                    priority={index === 0} // Only prioritize the first image for LCP
                />
                {image.link_url && (
                    <a
                    href={image.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0"
                    aria-label={image.alt_text || 'Slider link'}
                    />
                )}
                </div>
            </SwiperSlide>
            ))}
      </Swiper>
    </div>
  );
};