'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './smartbox.module.css';

interface SmartBox {
  id: string;
  serialNumber: string;
  productId: string;
  productName: string;
  currentFillPercent: number;
  status: 'active' | 'inactive' | 'maintenance';
  threshold: number;
  lastReading: string | null;
  location: string | null;
}

interface BoxReading {
  id: string;
  fillPercent: number;
  recordedAt: string;
}

export default function SmartBoxPage() {
  const [boxes, setBoxes] = useState<SmartBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<SmartBox | null>(null);
  const [readings, setReadings] = useState<BoxReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [editingBox, setEditingBox] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState(20);
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    fetchBoxes();
  }, []);

  const fetchBoxes = async () => {
    try {
      const response = await fetch('/api/b2b/smartbox');
      if (response.ok) {
        const data = await response.json();
        setBoxes(data.boxes);
      }
    } catch (error) {
      console.error('Failed to fetch SmartBoxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async (boxId: string) => {
    setReadingsLoading(true);
    try {
      const response = await fetch(`/api/b2b/smartbox/${boxId}/readings`);
      if (response.ok) {
        const data = await response.json();
        setReadings(data.readings);
      }
    } catch (error) {
      console.error('Failed to fetch readings:', error);
    } finally {
      setReadingsLoading(false);
    }
  };

  const handleSelectBox = (box: SmartBox) => {
    setSelectedBox(box);
    fetchReadings(box.id);
  };

  const handleStartEdit = (box: SmartBox) => {
    setEditingBox(box.id);
    setEditThreshold(box.threshold);
    setEditLocation(box.location || '');
  };

  const handleSaveEdit = async (boxId: string) => {
    try {
      const response = await fetch(`/api/b2b/smartbox/${boxId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold: editThreshold,
          location: editLocation,
        }),
      });

      if (response.ok) {
        setBoxes(boxes.map(b => 
          b.id === boxId 
            ? { ...b, threshold: editThreshold, location: editLocation }
            : b
        ));
        if (selectedBox?.id === boxId) {
          setSelectedBox({ ...selectedBox, threshold: editThreshold, location: editLocation });
        }
        setEditingBox(null);
      }
    } catch (error) {
      console.error('Failed to update SmartBox:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'inactive': return '#94a3b8';
      case 'maintenance': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const getFillColor = (percent: number) => {
    if (percent > 50) return '#22c55e';
    if (percent > 20) return '#f59e0b';
    return '#ef4444';
  };

  const getFillStatus = (percent: number, threshold: number) => {
    if (percent <= threshold) return 'Reorder triggered';
    if (percent <= threshold + 10) return 'Low';
    if (percent <= 50) return 'Medium';
    return 'Good';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading SmartBox data...</div>
      </div>
    );
  }

  if (boxes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>SmartBox Management</h1>
          <p>Monitor and manage your SmartBox devices</p>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h2>No SmartBoxes Yet</h2>
          <p>
            Your SmartBox devices will appear here once they&apos;re set up.
            Contact your account manager to schedule installation.
          </p>
          <Link href="/b2b/portal/account" className={styles.contactButton}>
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>SmartBox Management</h1>
        <p>Monitor and manage your SmartBox devices</p>
      </div>

      {/* Overview Cards */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewValue}>{boxes.length}</div>
          <div className={styles.overviewLabel}>Total Boxes</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewValue}>
            {boxes.filter(b => b.status === 'active').length}
          </div>
          <div className={styles.overviewLabel}>Active</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewValue}>
            {boxes.filter(b => b.currentFillPercent <= b.threshold).length}
          </div>
          <div className={styles.overviewLabel}>Need Reorder</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewValue}>
            {Math.round(boxes.reduce((sum, b) => sum + b.currentFillPercent, 0) / boxes.length)}%
          </div>
          <div className={styles.overviewLabel}>Avg. Fill Level</div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Box List */}
        <div className={styles.boxList}>
          <h2>Your SmartBoxes</h2>
          <div className={styles.boxes}>
            {boxes.map(box => (
              <div
                key={box.id}
                className={`${styles.boxCard} ${selectedBox?.id === box.id ? styles.selected : ''}`}
                onClick={() => handleSelectBox(box)}
              >
                <div className={styles.boxHeader}>
                  <div className={styles.boxSerial}>{box.serialNumber}</div>
                  <div
                    className={styles.boxStatus}
                    style={{ backgroundColor: getStatusColor(box.status) }}
                  >
                    {box.status}
                  </div>
                </div>
                <div className={styles.boxProduct}>{box.productName}</div>
                {box.location && (
                  <div className={styles.boxLocation}>📍 {box.location}</div>
                )}
                <div className={styles.fillMeter}>
                  <div
                    className={styles.fillLevel}
                    style={{
                      width: `${box.currentFillPercent}%`,
                      backgroundColor: getFillColor(box.currentFillPercent),
                    }}
                  />
                </div>
                <div className={styles.fillInfo}>
                  <span>{box.currentFillPercent}% full</span>
                  <span className={styles.fillStatus} style={{ color: getFillColor(box.currentFillPercent) }}>
                    {getFillStatus(box.currentFillPercent, box.threshold)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box Details */}
        {selectedBox && (
          <div className={styles.boxDetails}>
            <h2>Box Details</h2>
            
            <div className={styles.detailsCard}>
              <div className={styles.detailsHeader}>
                <h3>{selectedBox.serialNumber}</h3>
                <button
                  className={styles.editButton}
                  onClick={() => editingBox === selectedBox.id 
                    ? setEditingBox(null) 
                    : handleStartEdit(selectedBox)
                  }
                >
                  {editingBox === selectedBox.id ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Product</span>
                  <span className={styles.detailValue}>{selectedBox.productName}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status</span>
                  <span 
                    className={styles.detailValue}
                    style={{ color: getStatusColor(selectedBox.status) }}
                  >
                    {selectedBox.status}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Current Fill Level</span>
                  <span 
                    className={styles.detailValue}
                    style={{ color: getFillColor(selectedBox.currentFillPercent) }}
                  >
                    {selectedBox.currentFillPercent}%
                  </span>
                </div>
                
                {editingBox === selectedBox.id ? (
                  <>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Reorder Threshold</span>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={editThreshold}
                        onChange={(e) => setEditThreshold(Number(e.target.value))}
                        className={styles.editInput}
                      />
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Location</span>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="e.g., Kitchen, Break Room"
                        className={styles.editInput}
                      />
                    </div>
                    <div className={styles.editActions}>
                      <button
                        className={styles.saveButton}
                        onClick={() => handleSaveEdit(selectedBox.id)}
                      >
                        Save Changes
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Reorder Threshold</span>
                      <span className={styles.detailValue}>{selectedBox.threshold}%</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Location</span>
                      <span className={styles.detailValue}>
                        {selectedBox.location || 'Not set'}
                      </span>
                    </div>
                  </>
                )}

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Last Reading</span>
                  <span className={styles.detailValue}>
                    {selectedBox.lastReading 
                      ? new Date(selectedBox.lastReading).toLocaleString()
                      : 'No readings yet'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Reading History */}
            <div className={styles.readingsSection}>
              <h3>Recent Readings</h3>
              {readingsLoading ? (
                <div className={styles.readingsLoading}>Loading readings...</div>
              ) : readings.length === 0 ? (
                <div className={styles.noReadings}>No readings recorded yet</div>
              ) : (
                <>
                  <div className={styles.readingsChart}>
                    {readings.slice(0, 20).reverse().map((reading) => (
                      <div key={reading.id} className={styles.readingBar}>
                        <div
                          className={styles.readingFill}
                          style={{
                            height: `${reading.fillPercent}%`,
                            backgroundColor: getFillColor(reading.fillPercent),
                          }}
                          title={`${reading.fillPercent}% - ${new Date(reading.recordedAt).toLocaleString()}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className={styles.readingsList}>
                    {readings.slice(0, 10).map(reading => (
                      <div key={reading.id} className={styles.readingItem}>
                        <span className={styles.readingTime}>
                          {new Date(reading.recordedAt).toLocaleString()}
                        </span>
                        <span 
                          className={styles.readingValue}
                          style={{ color: getFillColor(reading.fillPercent) }}
                        >
                          {reading.fillPercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className={styles.helpSection}>
        <h2>📖 SmartBox Help</h2>
        <div className={styles.helpGrid}>
          <div className={styles.helpCard}>
            <h4>How it works</h4>
            <p>
              SmartBox monitors your coffee/tea inventory in real-time using weight sensors.
              When levels drop below your threshold, an automatic reorder is triggered.
            </p>
          </div>
          <div className={styles.helpCard}>
            <h4>Setting thresholds</h4>
            <p>
              Set your reorder threshold based on typical consumption and delivery times.
              We recommend 20-30% to ensure you never run out.
            </p>
          </div>
          <div className={styles.helpCard}>
            <h4>Need support?</h4>
            <p>
              Contact our B2B support team for any issues with your SmartBox devices.
              We&apos;re here to help!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
