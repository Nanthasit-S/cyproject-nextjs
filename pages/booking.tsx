// fixcy/pages/booking.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { RestaurantLayout } from '@/components/RestaurantLayout';
import { useNotification } from '@/lib/NotificationContext';

// Icons
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'reserved';
}

interface Zone {
  id: number;
  name: string;
  description: string;
  tables: Table[];
}

export default function BookingPage() {
  const { showNotification } = useNotification();
  const [zones, setZones] = useState<Zone[]>([]);
  const [isBookingEnabled, setIsBookingEnabled] = useState(true);
  const [bookingStatusLoading, setBookingStatusLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const currentDate = new Date().toISOString().slice(0, 10);

  const fetchBookingStatusAndTables = async () => {
    setBookingStatusLoading(true);
    setTablesLoading(true);
    try {
      const statusRes = await fetch('/api/booking-status');
      const statusData = await statusRes.json();
      setIsBookingEnabled(statusData.isBookingEnabled);
      setBookingStatusLoading(false);

      if (statusData.isBookingEnabled) {
        const tablesRes = await fetch(`/api/tables`);
        if (!tablesRes.ok) throw new Error('Failed to fetch tables');
        const tablesData = await tablesRes.json();
        setZones(tablesData);
      }
    } catch (error) {
      showNotification('Error', 'Error fetching page data.', 'error');
    } finally {
      setBookingStatusLoading(false);
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingStatusAndTables();
  }, []);

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
  };

  const handleOpenBookingModal = () => {
    if (selectedTable) {
      setIsModalOpen(true);
    } else {
      showNotification('Info', "Please select an available table first.", 'info');
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTable) return;
    setIsBooking(true);
    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          bookingDate: currentDate,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Booking failed');
      }
      showNotification('Success', 'Booking successful!', 'success');
      setIsModalOpen(false);
      setSelectedTable(null);
      fetchBookingStatusAndTables();
    } catch (error: any) {
      showNotification('Error', `Booking Error: ${error.message}`, 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const renderContent = () => {
    if (bookingStatusLoading) {
      return <Spinner label="Loading..." size="lg" />;
    }

    if (!isBookingEnabled) {
      return (
        <div className="mt-8 flex flex-col items-center gap-4 p-8 bg-warning-100 border-2 border-warning-300 rounded-2xl text-warning-800">
            <AlertIcon />
            <p className="text-xl font-bold">Booking is currently closed.</p>
            <p>ขออภัย ขณะนี้ระบบการจองโต๊ะปิดให้บริการ</p>
        </div>
      );
    }

    if (tablesLoading) {
        return <Spinner label="Loading tables..." size="lg" />;
    }

    return (
      <>
        <RestaurantLayout
          zones={zones}
          selectedTableId={selectedTable?.id || null}
          onTableSelect={handleTableSelect}
        />
        <Button
          color="primary"
          size="lg"
          className="mt-8"
          isDisabled={!selectedTable}
          onPress={handleOpenBookingModal}
        >
          {selectedTable ? `Book Table ${selectedTable.table_number}` : 'Select a Table'}
        </Button>
      </>
    );
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Reserve Your Table</h1>
          <h2 className={subtitle({ class: "mt-2" })}>
            Booking for today: {new Date(currentDate).toLocaleDateString('en-GB')}
          </h2>
        </div>
        
        {renderContent()}

      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          {selectedTable && (
            <>
              <ModalHeader>Confirm Booking</ModalHeader>
              <ModalBody>
                <p>You are about to book table <strong>{selectedTable.table_number}</strong> for today, <strong>{currentDate}</strong>.</p>
                <p className="text-sm text-default-500 mt-2">Please confirm your selection.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>Cancel</Button>
                <Button color="primary" onPress={handleConfirmBooking} disabled={isBooking}>{isBooking ? "Booking..." : "Confirm"}</Button>
              </ModalFooter>
            </>
          )}
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