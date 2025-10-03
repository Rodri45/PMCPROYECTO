export interface CalendarEvent {
  id: string;
  title: string;
  date: string;  // ISO o "YYYY-MM-DD"
}

export interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (id: string) => void;
}
