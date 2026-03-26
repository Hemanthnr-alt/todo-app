// frontend/src/components/SmartSuggestions.jsx
import { useMemo } from "react";

function timeToMinutes(time) {
  const [hour, minute] = time.split(":");
  return parseInt(hour, 10) * 60 + parseInt(minute, 10);
}

function findAvailableSlots(tasks, currentDate) {
  if (!currentDate) return [];

  const dayTasks = tasks.filter(t => t.dueDate === currentDate && t.startTime && t.endTime);
  const busySlots = dayTasks.map(t => ({
    start: timeToMinutes(t.startTime),
    end: timeToMinutes(t.endTime)
  }));

  busySlots.sort((a, b) => a.start - b.start);

  const availableSlots = [];
  let currentTime = 9 * 60;

  if (busySlots.length === 0 || busySlots[0].start > currentTime) {
    availableSlots.push({
      start: currentTime,
      end: Math.min(busySlots[0]?.start || 18 * 60, currentTime + 60),
    });
  }

  for (let i = 0; i < busySlots.length - 1; i++) {
    const gap = busySlots[i + 1].start - busySlots[i].end;
    if (gap >= 30) {
      availableSlots.push({
        start: busySlots[i].end,
        end: busySlots[i + 1].start,
      });
    }
  }

  const endOfWork = 18 * 60;
  const lastEnd = busySlots[busySlots.length - 1]?.end || 9 * 60;
  if (lastEnd < endOfWork) {
    availableSlots.push({
      start: lastEnd,
      end: endOfWork,
    });
  }

  return availableSlots;
}

const SmartSuggestions = ({ tasks, currentDate, onSelectTime }) => {
  const suggestions = useMemo(
    () => findAvailableSlots(tasks, currentDate),
    [tasks, currentDate]
  );

  const minutesToTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  if (suggestions.length === 0) return null;

  return (
    <div style={{
      marginBottom: "16px",
      padding: "12px",
      background: "rgba(16,185,129,0.1)",
      borderRadius: "12px",
      border: "1px solid rgba(16,185,129,0.2)"
    }}>
      <div style={{ fontSize: "12px", fontWeight: "bold", color: "#10b981", marginBottom: "8px" }}>
        💡 Smart Suggestions
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {suggestions.slice(0, 2).map((slot, idx) => (
          <button
            key={idx}
            onClick={() => onSelectTime(minutesToTime(slot.start), minutesToTime(slot.end))}
            style={{
              padding: "6px 12px",
              background: "rgba(16,185,129,0.2)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "20px",
              fontSize: "11px",
              cursor: "pointer",
              color: "#10b981"
            }}
          >
            {minutesToTime(slot.start)} - {minutesToTime(slot.end)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartSuggestions;
