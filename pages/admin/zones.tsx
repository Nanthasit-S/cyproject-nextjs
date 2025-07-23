import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;

interface DbZone {
  id: number;
  name: string;
  description?: string;
}

export default function AdminZonesPage() {
    const [zones, setZones] = useState<DbZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneDescription, setNewZoneDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // We can reuse the tables-manage GET endpoint to fetch zones
            const res = await fetch('/api/admin/tables-manage');
            const data = await res.json();
            // Fetching full zone data separately for the description field might be needed
            // For now, we assume the GET endpoint could be extended to return full zone details
            // Or we create a new endpoint just for zones. Let's assume we get it from here for simplicity.
            const zonesRes = await fetch('/api/admin/tables-manage?entity=zones'); // This is a placeholder, adapt if you create a separate zones API
            const fullZonesData = await res.json(); // Re-using for now.
            setZones(fullZonesData.zones);

        } catch (error) {
            alert('Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = () => {
        setNewZoneName('');
        setNewZoneDescription('');
        setIsModalOpen(true);
    };
    
    const handleAddZone = async () => {
        if (!newZoneName) return alert('Zone name is required.');
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/tables-manage?entity=zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newZoneName, description: newZoneDescription }),
            });
            if (!response.ok) throw new Error('Failed to add zone');
            alert('Zone added successfully!');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert('Error adding zone.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteZone = async (id: number) => {
        if (!confirm('Are you sure you want to delete this zone? All tables within it must be removed first.')) return;
        try {
            const response = await fetch(`/api/admin/tables-manage?entity=zones`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('Zone deleted successfully!');
            fetchData();
        } catch (error: any) {
            alert(`Error deleting zone: ${error.message}`);
        }
    };
    
    return (
    <DefaultLayout>
      <div>
        <h1 className={title()}>Zone Management</h1>
        <p className={subtitle({ class: "!w-full mt-2" })}>Create or remove table zones in your establishment.</p>
      </div>

      <div className="mt-8 flex justify-end">
        <Button color="primary" onPress={handleOpenModal} startContent={<PlusIcon />}>
          Add New Zone
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Spinner />
        ) : (
          <Table aria-label="List of zones">
            <TableHeader>
              <TableColumn>ZONE NAME</TableColumn>
              <TableColumn>DESCRIPTION</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody items={zones}>
              {(item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description || 'N/A'}</TableCell>
                  <TableCell>
                    <Button isIconOnly color="danger" variant="light" onPress={() => handleDeleteZone(item.id)}>
                      <DeleteIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
            <ModalHeader>Add New Zone</ModalHeader>
            <ModalBody className="space-y-4">
                <Input
                    label="Zone Name"
                    placeholder="e.g., VIP Area, Rooftop"
                    value={newZoneName}
                    onValueChange={setNewZoneName}
                />
                <Input
                    label="Description (Optional)"
                    placeholder="A short description of the zone"
                    value={newZoneDescription}
                    onValueChange={setNewZoneDescription}
                />
            </ModalBody>
            <ModalFooter>
                <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>Cancel</Button>
                <Button color="primary" onPress={handleAddZone} disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Zone'}
                </Button>
            </ModalFooter>
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // ... (getServerSideProps remains the same)
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