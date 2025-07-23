// fixcy/pages/admin/management.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { Button, ButtonGroup } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Switch } from "@heroui/switch";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Selection } from "@react-types/shared";
import { Chip } from "@heroui/chip";
import { useNotification } from '@/lib/NotificationContext';

// --- Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c5.53 0 10 4.47 10 10s-4.47 10-10 10S2 17.53 2 12S6.47 2 12 2m3.59 5L12 10.59L8.41 7L7 8.41L10.59 12L7 15.59L8.41 17L12 13.41L15.59 17L17 15.59L13.41 12L17 8.41z"/></svg>;

// --- Type Definitions ---
interface DbTable {
  id: number;
  table_number: string;
  capacity: number;
  zone_id: number;
  booking_id: number | null;
  booked_by_user_id: number | null;
  booked_by_user_name: string | null;
}
interface DbZone {
  id: number;
  name: string;
  description?: string;
}

// --- Settings Management Component ---
const SettingsManagement = () => {
    const { showNotification } = useNotification();
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
                showNotification('Error', 'Failed to load current status.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, [showNotification]);

    const handleStatusChange = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/booking-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isBookingEnabled: !isBookingEnabled }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            setIsBookingEnabled(!isBookingEnabled);
            showNotification('Success', 'Booking status updated successfully!', 'success');
        } catch (error) {
            showNotification('Error', 'Error updating status.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="max-w-md mt-4">
            <CardHeader><h2 className="text-xl font-bold">Booking System</h2></CardHeader>
            <CardBody>
                {isLoading ? <Spinner label="Loading..." /> : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Enable Table Booking</p>
                            <p className="text-sm text-default-500">Allow users to reserve tables.</p>
                        </div>
                        <Switch isSelected={isBookingEnabled} onValueChange={handleStatusChange} isDisabled={isSaving} color="success" aria-label="Toggle booking system" />
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

// --- Zone Management Component ---
const ZoneManagement = ({ zones: initialZones, fetchData }: { zones: DbZone[], fetchData: () => void }) => {
    const { showNotification } = useNotification();
    const [zones, setZones] = useState<DbZone[]>(initialZones);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneDescription, setNewZoneDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { setZones(initialZones); }, [initialZones]);

    const handleOpenModal = () => {
        setNewZoneName('');
        setNewZoneDescription('');
        setIsModalOpen(true);
    };

    const handleAddZone = async () => {
        if (!newZoneName) return showNotification('Info', 'Zone name is required.', 'info');
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/tables-manage?entity=zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newZoneName, description: newZoneDescription }),
            });
            if (!response.ok) throw new Error('Failed to add zone');
            showNotification('Success', 'Zone added successfully!', 'success');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            showNotification('Error', 'Error adding zone.', 'error');
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
            showNotification('Success', 'Zone deleted successfully!', 'success');
            fetchData();
        } catch (error: any) {
            showNotification('Error', `Error deleting zone: ${error.message}`, 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center my-4">
                <h2 className='text-xl font-bold'>All Zones</h2>
                <Button color="primary" onPress={handleOpenModal} startContent={<PlusIcon />}>Add New Zone</Button>
            </div>
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
                                <Button isIconOnly color="danger" variant="light" onPress={() => handleDeleteZone(item.id)}><DeleteIcon /></Button>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Add New Zone</ModalHeader>
                    <ModalBody className="space-y-4">
                        <Input label="Zone Name" placeholder="e.g., VIP Area, Rooftop" value={newZoneName} onValueChange={setNewZoneName}/>
                        <Input label="Description (Optional)" placeholder="A short description of the zone" value={newZoneDescription} onValueChange={setNewZoneDescription}/>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleAddZone} disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Zone'}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

// --- Table Management Component ---
const TableManagement = ({ tables: initialTables, zones, fetchData }: { tables: DbTable[], zones: DbZone[], fetchData: () => void }) => {
    const { showNotification } = useNotification();
    const [tables, setTables] = useState<DbTable[]>(initialTables);
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState('2');
    const [addSelectedZone, setAddSelectedZone] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<DbTable | null>(null);
    const [editCapacity, setEditCapacity] = useState('');
    const [editZoneId, setEditZoneId] = useState<string>('');

    useEffect(() => { setTables(initialTables); }, [initialTables]);

    const handleOpenAddModal = () => {
        setNewTableNumber('');
        setNewTableCapacity('2');
        setAddSelectedZone('');
        setIsAddModalOpen(true);
    };

    const handleAddTable = async () => {
        if (!newTableNumber || !newTableCapacity || !addSelectedZone) return showNotification('Info', 'Please fill all fields.', 'info');
        setIsSubmitting(true);
        try {
            await fetch('/api/admin/tables-manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table_number: newTableNumber, capacity: parseInt(newTableCapacity), zone_id: parseInt(addSelectedZone) }),
            });
            showNotification('Success', 'Table added successfully!', 'success');
            setIsAddModalOpen(false);
            fetchData();
        } catch (error) { showNotification('Error', 'Error adding table.', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleOpenEditModal = (table: DbTable) => {
        setEditingTable(table);
        setEditCapacity(table.capacity.toString());
        setEditZoneId(table.zone_id.toString());
        setIsEditModalOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!editingTable) return;
        setIsSubmitting(true);
        try {
            await fetch('/api/admin/tables-manage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [editingTable.id], capacity: parseInt(editCapacity), zone_id: parseInt(editZoneId) }),
            });
            showNotification('Success', 'Table updated successfully!', 'success');
            setIsEditModalOpen(false);
            setEditingTable(null);
            fetchData();
        } catch (error) { showNotification('Error', 'Error updating table.', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const selectedIds = useMemo(() => Array.from(selectedKeys).map(key => Number(key)), [selectedKeys]);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} tables?`)) return;
        try {
            await fetch('/api/admin/tables-manage', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });
            showNotification('Success', 'Selected tables deleted!', 'success');
            setSelectedKeys(new Set([]));
            fetchData();
        } catch (error) { showNotification('Error', 'Error deleting tables.', 'error'); }
    };

    const handleCancelBooking = async (bookingId: number, userId: number, tableName: string) => {
        if (!confirm(`Are you sure you want to cancel the booking for table ${tableName}?\nA notification will be sent to the user.`)) return;
        try {
            const response = await fetch('/api/admin/cancel-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, userId, tableName }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showNotification('Success', 'Booking cancelled successfully!', 'success');
            fetchData();
        } catch (error: any) {
            showNotification('Error', `Error cancelling booking: ${error.message}`, 'error');
        }
    };

    const getZoneName = (zoneId: number) => zones.find(z => z.id === zoneId)?.name || 'N/A';

    const renderTopContent = useMemo(() => (
        <div className="flex justify-between items-center my-4">
            <div>
                {selectedIds.length > 0 ? (
                    <div className='flex gap-2 items-center'>
                        <span className="text-default-500 text-sm">{selectedIds.length} of {tables.length} selected</span>
                        <Button color="danger" variant="flat" size="sm" onPress={handleBulkDelete}>Delete Selected</Button>
                    </div>
                ) : <h2 className='text-xl font-bold'>All Tables (Today's Status)</h2>}
            </div>
            <Button color="primary" onPress={handleOpenAddModal} startContent={<PlusIcon />}>Add New Table</Button>
        </div>
    ), [selectedIds, tables.length, handleBulkDelete, handleOpenAddModal]);

    return (
        <div>
            <Table aria-label="List of tables" selectionMode="multiple" selectedKeys={selectedKeys} onSelectionChange={setSelectedKeys} topContent={renderTopContent} topContentPlacement="outside" removeWrapper>
                <TableHeader>
                    <TableColumn>TABLE NO.</TableColumn>
                    <TableColumn>ZONE</TableColumn>
                    <TableColumn>CAPACITY</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>BOOKED BY</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={tables}>
                    {(item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.table_number}</TableCell>
                            <TableCell>{getZoneName(item.zone_id)}</TableCell>
                            <TableCell>{item.capacity}</TableCell>
                            <TableCell><Chip color={item.booking_id ? "danger" : "success"} variant="flat">{item.booking_id ? "Reserved" : "Available"}</Chip></TableCell>
                            <TableCell>{item.booked_by_user_name || 'N/A'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button isIconOnly variant="light" size="sm" onPress={() => handleOpenEditModal(item)} isDisabled={!!item.booking_id}><EditIcon /></Button>
                                    {item.booking_id && item.booked_by_user_id && (
                                        <Button isIconOnly variant="light" color="danger" size="sm" onPress={() => handleCancelBooking(item.booking_id!, item.booked_by_user_id!, item.table_number)}><CancelIcon /></Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Add New Table</ModalHeader>
                    <ModalBody className="space-y-4">
                        <Input label="Table Number" placeholder="e.g., A1" value={newTableNumber} onValueChange={setNewTableNumber} />
                        <Input label="Capacity" type="number" value={newTableCapacity} onValueChange={setNewTableCapacity} />
                        <Select label="Zone" placeholder="Select a zone" selectedKeys={addSelectedZone ? [addSelectedZone] : []} onSelectionChange={(keys) => setAddSelectedZone(Array.from(keys)[0] as string)}>
                            {zones.map((zone) => <SelectItem key={zone.id}>{zone.name}</SelectItem>)}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleAddTable} disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Table'}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Edit Table "{editingTable?.table_number}"</ModalHeader>
                    <ModalBody className="space-y-4">
                        <Input label="Table Number" value={editingTable?.table_number || ''} isDisabled />
                        <Input label="Capacity" type="number" value={editCapacity} onValueChange={setEditCapacity} />
                        <Select label="Zone" placeholder="Select a zone" selectedKeys={editZoneId ? [editZoneId] : []} onSelectionChange={(keys) => setEditZoneId(Array.from(keys)[0] as string)}>
                            {zones.map((zone) => <SelectItem key={zone.id}>{zone.name}</SelectItem>)}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleSaveChanges} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

// --- Main Page Component ---
export default function AdminManagementPage() {
    const { showNotification } = useNotification();
    const [tables, setTables] = useState<DbTable[]>([]);
    const [zones, setZones] = useState<DbZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tables' | 'zones' | 'settings'>('tables');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/tables-manage');
            if (!res.ok) throw new Error('Failed to fetch data');
            const { tables, zones } = await res.json();
            setTables(tables);
            setZones(zones);
        } catch (error) {
            console.error(error);
            showNotification('Error', 'Failed to fetch management data.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        if (activeTab === 'tables' || activeTab === 'zones') {
            fetchData();
        }
    }, [activeTab, fetchData]);

    return (
        <DefaultLayout>
            <div>
                <h1 className={title()}>Establishment Management</h1>
                <p className={subtitle({ class: "!w-full mt-2" })}>Manage tables, zones, and booking settings.</p>
            </div>

            <ButtonGroup className="mt-6">
                <Button onPress={() => setActiveTab('tables')} variant={activeTab === 'tables' ? 'solid' : 'bordered'} color="primary">Tables</Button>
                <Button onPress={() => setActiveTab('zones')} variant={activeTab === 'zones' ? 'solid' : 'bordered'} color="primary">Zones</Button>
                <Button onPress={() => setActiveTab('settings')} variant={activeTab === 'settings' ? 'solid' : 'bordered'} color="primary">Settings</Button>
            </ButtonGroup>

            <div className="mt-4">
                {isLoading && activeTab !== 'settings' ? (
                    <div className="flex justify-center mt-8"><Spinner label="Loading data..." /></div>
                ) : (
                    <>
                        {activeTab === 'tables' && <TableManagement tables={tables} zones={zones} fetchData={fetchData} />}
                        {activeTab === 'zones' && <ZoneManagement zones={zones} fetchData={fetchData} />}
                        {activeTab === 'settings' && <SettingsManagement />}
                    </>
                )}
            </div>
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