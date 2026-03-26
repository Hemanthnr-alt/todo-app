// frontend/src/components/TimeRangePicker.jsx
import { useMemo, useEffect } from "react";

const TimeRangePicker = ({ startTime, endTime, onStartChange, onEndChange, onDurationChange }) => {
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  };

  const duration = useMemo(
    () => (startTime && endTime ? calculateDuration(startTime, endTime) : 0),
    [startTime, endTime]
  );

  const formatDuration = (minutes) => {
    if (minutes <= 0) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  useEffect(() => {
    if (startTime && endTime) {
      onDurationChange(duration);
    }
  }, [startTime, endTime, duration, onDurationChange]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Start Time</label>
          <input
            type="time"
            value={startTime || ""}
            onChange={(e) => onStartChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              background: "transparent",
              color: "inherit"
            }}
          />
        </div>
        {duration > 0 && (
          <div style={{ padding: "0 8px" }}>
            <span style={{ fontSize: "12px", color: "#10b981" }}>{formatDuration(duration)}</span>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>End Time</label>
          <input
            type="time"
            value={endTime || ""}
            onChange={(e) => onEndChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              background: "transparent",
              color: "inherit"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TimeRangePicker;
