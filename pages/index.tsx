// forgm/pages/index.tsx
import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { ImageSlider } from '@/components/ImageSlider';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";

const MusicIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const DrinkIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 2h-7a.5.5 0 00-.5.5v1.382a1.5 1.5 0 00.708 1.268L12 7.5l3.292-2.35a1.5 1.5 0 00.708-1.268V2.5a.5.5 0 00-.5-.5z"/><path d="M8 12.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5v-2a.5.5 0 00-.5-.5h-7a.5.5 0 00-.5.5v2zM5 22h14"/><path d="M7 13v9M17 13v9"/></svg>;
const CalendarIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

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
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/profile');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return (
        <DefaultLayout>
            <div className="flex justify-center items-center h-[calc(100vh-150px)]">
                <Spinner label="Loading..." size="lg" />
            </div>
        </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      {sliderImages.length > 0 && <ImageSlider images={sliderImages} />}

      <section className="flex flex-col items-center justify-center gap-4 py-12 md:py-16">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title({ size: "lg" })}>สาดความสนุก&nbsp;</h1>
          <h1 className={title({ color: "violet", size: "lg" })}>สุดทุกค่ำคืน</h1>
          <h2 className={subtitle({ class: "mt-4" })}>
            พบกับเครื่องดื่มสุดพิเศษและดนตรีสดที่เราคัดสรรมาเพื่อคุณ พร้อมระบบจองโต๊ะที่แสนสะดวกสบาย
          </h2>
        </div>

        <div className="flex gap-4 mt-4">
          <Link
            className={buttonStyles({
              color: "success",
              radius: "full",
              variant: "shadow",
              size: "lg"
            })}
            href="/api/auth/line"
          >
            Login with LINE
          </Link>
          <Link
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "bordered",
               size: "lg"
            })}
            href="#features"
          >
            ดูเพิ่มเติม
          </Link>
        </div>
      </section>

      {/* เพิ่มส่วน Features */}
      <section id="features" className="w-full my-16 py-16 bg-default-50 rounded-2xl">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tight">What We Offer</h2>
                <p className="text-default-500 mt-2 text-lg">ประสบการณ์สุดพิเศษรอคุณอยู่</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center p-8 shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex justify-center mb-5 text-violet-500"><MusicIcon /></div>
                    <h3 className="text-xl font-semibold mb-2">ดนตรีสดทุกคืน</h3>
                    <p className="text-default-600">เพลิดเพลินกับวงดนตรีสดคุณภาพ ที่จะมาสร้างความบันเทิงให้คุณตลอดทั้งคืน</p>
                </Card>
                <Card className="text-center p-8 shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex justify-center mb-5 text-violet-500"><DrinkIcon /></div>
                    <h3 className="text-xl font-semibold mb-2">เครื่องดื่มหลากหลาย</h3>
                    <p className="text-default-600">บาร์เทนเดอร์มืออาชีพพร้อมรังสรรค์เครื่องดื่มแก้วโปรดสำหรับคุณ</p>
                </Card>
                <Card className="text-center p-8 shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex justify-center mb-5 text-violet-500"><CalendarIcon /></div>
                    <h3 className="text-xl font-semibold mb-2">จองโต๊ะล่วงหน้า</h3>
                    <p className="text-default-600">วางแผนค่ำคืนสุดพิเศษของคุณได้ง่ายๆ ผ่านระบบจองโต๊ะออนไลน์ของเรา</p>
                </Card>
            </div>
        </div>
      </section>

    </DefaultLayout>
  );
}

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