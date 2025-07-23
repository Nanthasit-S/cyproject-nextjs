// forgm/pages/profile.tsx
import { GetServerSideProps } from 'next';
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@heroui/button";
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from "@heroui/spinner";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Link } from "@heroui/link";
import NextLink from 'next/link';

interface UserProfile {
  id: number;
  displayName: string;
  pictureUrl: string;
  role: 'admin' | 'user';
  phone_number?: string;
  phone_verified?: boolean;
}

interface ProfilePageProps {
  initialUser: UserProfile;
}

export default function ProfilePage({ initialUser }: ProfilePageProps) {
  const { user, loading } = useAuth();
  const displayUser = loading ? initialUser : user;

  if (loading && !displayUser) {
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
      <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10">
        
        <Card className="max-w-xl w-full p-4 md:p-8">
            <CardHeader className="flex flex-col md:flex-row items-center gap-6">
                <Avatar src={displayUser?.pictureUrl} className="w-28 h-28 text-large ring-2 ring-offset-2 ring-primary ring-offset-background" />
                <div className="text-center md:text-left">
                    <h1 className={title({ size: "sm" })}>Welcome, {displayUser?.displayName || 'Guest'}!</h1>
                    <p className={subtitle({ class: "mt-1 !w-full text-base" })}>
                        Your personal dashboard.
                    </p>
                </div>
            </CardHeader>
            <CardBody className="mt-8">
                 <h2 className="text-xl font-semibold mb-4 text-center md:text-left">Account Status</h2>
                 <div className="p-5 bg-default-100 rounded-xl">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">Phone Number</p>
                    </div>
                 </div>
            </CardBody>
        </Card>

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