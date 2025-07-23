// fixcy/components/RestaurantLayout.tsx
import React from 'react';

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

interface RestaurantLayoutProps {
  zones: Zone[];
  selectedTableId: number | null;
  onTableSelect: (table: Table) => void;
}

export const RestaurantLayout: React.FC<RestaurantLayoutProps> = ({ zones, selectedTableId, onTableSelect }) => {
  return (
    <div className="restaurant-layout w-full max-w-5xl">
      {/* ส่วนเวที (ตัวอย่าง) */}
      <div className="stage">
        <p>STAGE</p>
      </div>

      {zones.map((zone) => (
        <div key={zone.id} className="zone-container">
          <h3 className="zone-title">{zone.name}</h3>
          <div className="table-grid">
            {zone.tables.map((table) => (
              <div
                key={table.id}
                className="table-wrapper"
                onClick={() => table.status === 'available' && onTableSelect(table)}
              >
                <div
                  className={`
                    table-div 
                    ${table.status}
                    ${selectedTableId === table.id ? 'selected' : ''}
                  `}
                >
                  <span className="table-number">{table.table_number}</span>
                  <span className="table-capacity">({table.capacity} seats)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};