// forgm/pages/profile.tsx
import { GetServerSideProps } from 'next';
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from "@heroui/spinner";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-full">
          <Spinner label="Loading..." />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Welcome, {user?.displayName || 'Guest'}!</h1>
          <p className="mt-4">This is your profile page.</p>
        </div>
      </section>
    </DefaultLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { auth_token } = context.req.cookies;

  if (!auth_token) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: {} };
};