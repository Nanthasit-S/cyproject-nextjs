// fixcy/pages/inbox.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { useAuth } from '@/lib/AuthContext';
import { useNotification } from '@/lib/NotificationContext';
import { format } from 'date-fns';
// vvvvvvvvvvvvvv NEW IMPORT vvvvvvvvvvvvvv
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
// ^^^^^^^^^^^^^^ NEW IMPORT ^^^^^^^^^^^^^^

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5l-8-5V6l8 5l8-5v2z"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;

export default function InboxPage() {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // vvvvvvvvvvvvvv NEW STATES vvvvvvvvvvvvvv
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // ^^^^^^^^^^^^^^ NEW STATES ^^^^^^^^^^^^^^

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const res = await fetch('/api/notifications');
                if (!res.ok) throw new Error('Failed to fetch notifications');
                const data: Notification[] = await res.json();
                setNotifications(data);

                const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
                if (unreadIds.length > 0) {
                    await fetch('/api/notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: unreadIds }),
                    });
                }
            } catch (error) {
                console.error(error);
                showNotification('Error', 'Could not load notifications.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [user, showNotification]);
    
    // vvvvvvvvvvvvvv UPDATED FUNCTION vvvvvvvvvvvvvv
    const handleDeleteConfirmation = (idToDelete: number) => {
        setNotificationToDelete(idToDelete);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (notificationToDelete === null) return;
        setIsDeleting(true);
        try {
            const res = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [notificationToDelete] })
            });
            if (!res.ok) throw new Error('Failed to delete notification');

            setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
            showNotification('Success', 'Notification removed.', 'success');
            setNotificationToDelete(null);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            showNotification('Error', 'Could not remove notification.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };
    // ^^^^^^^^^^^^^^ UPDATED FUNCTION ^^^^^^^^^^^^^^

    return (
        <DefaultLayout>
            <div className="mb-8">
                <h1 className={title()}>Inbox</h1>
                <p className={subtitle({ class: "!w-full mt-2" })}>Your latest notifications and alerts.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner label="Loading messages..." size="lg" />
                </div>
            ) : (
                <Card className="max-w-4xl mx-auto">
                    <CardBody>
                        {notifications.length === 0 ? (
                            <div className="text-center text-default-500 py-12">
                                <p className="text-lg">Your inbox is empty.</p>
                                <p>You have no new notifications.</p>
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {notifications.map((notif) => (
                                    <li key={notif.id} className="p-4 rounded-lg flex items-start justify-between gap-4 bg-default-100">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1 text-default-500">
                                                <MailIcon />
                                            </div>
                                            <div>
                                                <p>{notif.message}</p>
                                                <p className="text-xs text-default-500 mt-1">
                                                    {format(new Date(notif.created_at), 'PPP p')}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            color="danger"
                                            size="sm"
                                            aria-label="Delete notification"
                                            // vvvvvvvvvvvvvv UPDATED ONPRESS vvvvvvvvvvvvvv
                                            onPress={() => handleDeleteConfirmation(notif.id)}
                                            // ^^^^^^^^^^^^^^ UPDATED ONPRESS ^^^^^^^^^^^^^^
                                        >
                                            <DeleteIcon />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardBody>
                </Card>
            )}

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        Are you sure you want to delete this notification?
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" variant="light" onPress={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleDelete} isLoading={isDeleting}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { auth_token } = context.req.cookies;
    if (!auth_token) {
        return { redirect: { destination: '/', permanent: false } };
    }
    return { props: {} };
};