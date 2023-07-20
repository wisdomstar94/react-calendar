"use client"
import { useCalendar } from "@/hooks/use-calendar/use-calendar.hook";
import { useEffect } from "react";

export default function Page() {
  const calendar = useCalendar();

  useEffect(() => {
    const info = calendar.getDayCalendarInfo(new Date());
    console.log('info', info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      console log 를 확인해보세요.
    </div>
  );
}
