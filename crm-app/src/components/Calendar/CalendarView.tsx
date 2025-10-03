import React from "react";
import type { CalendarViewProps, CalendarEvent } from "../../types/CalendarViewProps";

const CalendarView: React.FC<CalendarViewProps> = ({
  events = [],
  onEventClick = () => {}
}) => (
  <ul>
    {events.map((e: CalendarEvent) => (
      <li key={e.id} onClick={() => onEventClick(e.id)}>
        {e.title} — {e.date}
      </li>
    ))}
  </ul>
);

export default CalendarView;
