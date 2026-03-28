import { useMemo, useEffect } from "react";

const TimeRangePicker = ({ startTime, endTime, onStartChange, onEndChange, onDurationChange }) => {
  const duration = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }, [startTime, endTime]);

  const fmtDuration = (m) => {
    if (m <= 0) return "";
    const h = Math.floor(m / 60), mins = m % 60;
    if (h > 0 && mins > 0) return `${h}h ${mins}m`;
    return h > 0 ? `${h}h` : `${mins}m`;
  };

  useEffect(() => {
    if (startTime && endTime) onDurationChange?.(duration);
  }, [startTime, endTime, duration, onDurationChange]);

  const inputStyle = {
    width: "100%", padding: "10px", borderRadius: "10px",
    border: "1px solid rgba(255,107,157,0.2)",
    background: "transparent", color: "inherit",
    fontFamily: "inherit", fontSize: "13px", outline: "none",
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "11px", marginBottom: "4px", display: "block", fontWeight: 600 }}>Start</label>
          <input type="time" value={startTime || ""} onChange={e => onStartChange(e.target.value)} style={inputStyle} />
        </div>
        {duration > 0 && (
          <div style={{ padding: "0 4px", marginTop: "16px" }}>
            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>{fmtDuration(duration)}</span>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "11px", marginBottom: "4px", display: "block", fontWeight: 600 }}>End</label>
          <input type="time" value={endTime || ""} onChange={e => onEndChange(e.target.value)} style={inputStyle} />
        </div>
      </div>
    </div>
  );
};

export default TimeRangePicker;
