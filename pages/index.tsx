// forgm/pages/index.tsx
import { GetServerSideProps } from 'next';
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { ImageSlider } from '@/components/ImageSlider';
import { useAuth } from '@/lib/AuthContext'; // 👈 Import useAuth hook

interface SlideImage {
  id: number;
  image_url: string;
  alt_text?: string;
  link_url?: string;
}

interface IndexPageProps {
  sliderImages: SlideImage[];
}

export default function IndexPage({ sliderImages }: IndexPageProps) {
  const { isAuthenticated, loading } = useAuth(); // 👈 ใช้ hook เพื่อดึงสถานะ

  return (
    <DefaultLayout>
      {sliderImages.length > 0 && <ImageSlider images={sliderImages} />}

      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-xl text-center justify-center">
          <span className={title()}>Make&nbsp;</span>
          <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
          <br />
          <span className={title()}>
            websites regardless of your design experience.
          </span>
          <div className={subtitle({ class: "mt-4" })}>
            Beautiful, fast and modern React UI library.
          </div>
        </div>

        {/* 👇 ตรวจสอบสถานะก่อนแสดงผลปุ่ม */}
        {!loading && !isAuthenticated && (
          <div className="flex gap-3">
            <Link
              className={buttonStyles({
                color: "success",
                radius: "full",
                variant: "shadow",
              })}
              href="/api/auth/line"
            >
              Login with LINE
            </Link>
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}

// getServerSideProps ยังคงเหมือนเดิม
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? `https://${context.req.headers.host}/api/slider-images` 
      : 'http://localhost:3000/api/slider-images';
      
    const res = await fetch(apiUrl);

    if (!res.ok) {
        console.error(`Failed to fetch slider images: ${res.status}`);
        return { props: { sliderImages: [] } };
    }
    const sliderImages = await res.json();
    return { props: { sliderImages } };
  } catch (error) {
    console.error("Error fetching slider images for index page:", error);
    return { props: { sliderImages: [] } };
  }
};