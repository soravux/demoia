import React from 'react';
import './detection-table.css';

/**
 * DetectionTable component displays a table of detected objects and their counts
 * @param {Object} detectionCounts - Object with class names as keys and counts as values
 */
const DetectionTable = ({ detectionCounts = {} }) => {
  // Convert detection counts to array and sort by count (descending)
  const sortedDetections = Object.entries(detectionCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([className, count]) => ({ className, count }));

  // Always show 5 rows - pad with empty rows if needed
  const maxRows = 5;
  const rowsToShow = [];
  
  // Add actual detections
  for (let i = 0; i < Math.min(sortedDetections.length, maxRows); i++) {
    rowsToShow.push(sortedDetections[i]);
  }
  
  // Pad with empty rows to maintain fixed height
  while (rowsToShow.length < maxRows) {
    rowsToShow.push({ className: '', count: 0, isEmpty: true });
  }

  return (
    <div className="detection-table-container">
      <h3>Detection Results</h3>
      <div className="detection-table-wrapper">
        <table className="detection-table">
          <thead>
            <tr>
              <th>Object Class</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map(({ className, count, isEmpty }, index) => (
              <tr key={isEmpty ? `empty-${index}` : className} className={isEmpty ? 'empty-row' : ''}>
                <td className="class-name">
                  {!isEmpty && (
                    <span className="class-label">{className}</span>
                  )}
                </td>
                <td className="count">
                  {!isEmpty && (
                    <span className="count-badge">{count}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="detection-summary">
        <p>
          Total objects detected: <strong>{sortedDetections.reduce((sum, { count }) => sum + count, 0)}</strong>
        </p>
        <p>
          Unique classes: <strong>{sortedDetections.length}</strong>
        </p>
      </div>
    </div>
  );
};

export default DetectionTable;
