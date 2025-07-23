// fixcy/pages/admin/settings.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { Switch } from "@heroui/switch";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";

export default function AdminSettingsPage() {
    const [isBookingEnabled, setIsBookingEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/admin/booking-status');
                const data = await res.json();
                setIsBookingEnabled(data.isBookingEnabled);
            } catch (error) {
                alert("Failed to load current status.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleStatusChange = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/booking-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isBookingEnabled: !isBookingEnabled }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            setIsBookingEnabled(!isBookingEnabled); // Update state on success
            alert('Booking status updated successfully!');
        } catch (error) {
            alert('Error updating status.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DefaultLayout>
            <div>
                <h1 className={title()}>System Settings</h1>
                <p className={subtitle({ class: "!w-full mt-2" })}>Manage system-wide settings for your application.</p>
            </div>

            <Card className="mt-8 max-w-md">
                <CardHeader>
                    <h2 className="text-xl font-bold">Booking System</h2>
                </CardHeader>
                <CardBody>
                    {isLoading ? (
                        <Spinner label="Loading..." />
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="font-semibold">Enable Table Booking</p>
                                <p className="text-sm text-default-500">
                                    Allow users to reserve tables.
                                </p>
                            </div>
                            <Switch
                                isSelected={isBookingEnabled}
                                onValueChange={handleStatusChange}
                                isDisabled={isSaving}
                                color="success"
                                aria-label="Toggle booking system"
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </DefaultLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { auth_token } = context.req.cookies;
    if (!auth_token) return { redirect: { destination: '/', permanent: false } };
    try {
        const decoded: any = jwt.verify(auth_token, process.env.JWT_SECRET!);
        if (decoded.role !== 'admin') {
            return { redirect: { destination: '/profile', permanent: false } };
        }
        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/', permanent: false } };
    }
};