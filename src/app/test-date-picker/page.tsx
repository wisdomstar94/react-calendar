"use client"
import { DatePicker } from "@/components/date-picker/date-picker.component";
import { useCalendar } from "@/hooks/use-calendar/use-calendar.hook";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isShow, setIsShow] = useState<boolean>();
  const [currentDate, setCurrentDate] = useState<Date>();

  return (
    <div>
      <div style={{ paddingLeft: '1600px', paddingRight: '1600px', paddingTop: '1600px', paddingBottom: '1600px' }}>
        <input ref={inputRef} type="text" className="border border-slate-700 box-border" />
      </div>
      
      <DatePicker 
        inputSelector={{
          ref: inputRef,
          isMatchInputWidth: true,
        }}
        isShow={isShow}
        setIsShow={setIsShow}
        // width={360}
        />
    </div>
  );
}
