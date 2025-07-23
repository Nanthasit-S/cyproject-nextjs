// forgm/layouts/default.tsx
import { Head } from "./head";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer"; //  <-- เพิ่ม import

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-background"> {/* <-- แก้ไข h-screen เป็น min-h-screen */}
      <Head />
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}
      </main>
      <Footer /> {/* <-- เพิ่ม Footer ที่นี่ */}
    </div>
  );
}