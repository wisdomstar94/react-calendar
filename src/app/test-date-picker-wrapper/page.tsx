"use client"

import { DatePickerWrapper } from "@/components/date-picker-wrapper/date-picker-wrapper.component";
import { IDatePicker } from "@/components/date-picker/date-picker.interface";
import { useEffect, useState } from "react";

export default function Page() {
  const [selectedRangeDate, setSelectedRangeDate] = useState<IDatePicker.RangeDate>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [init, setInit] = useState<boolean>(false);

  useEffect(() => {
    setInit(true);
  }, []);

  useEffect(() => {
    if (init === false) return;

    setSelectedRangeDate({
      start: new Date(`2023-09-04`),
      end: new Date(`2023-09-22`),
    });

    setSelectedDate(new Date(`2023-09-04`));

    setTimeout(() => {
      setSelectedRangeDate({
        start: new Date(`2023-10-09`),
        end: new Date(`2023-11-23`),
      });

      setSelectedDate(new Date(`2023-11-23 11:14:48`));
    }, 5000);
  }, [init]);

  return (
    <div>
      <div style={{ paddingLeft: '1600px', paddingRight: '1600px', paddingTop: '1600px', paddingBottom: '1600px' }}>
        <div>
          range
        </div>
        <DatePickerWrapper
          selectedRangeDate={selectedRangeDate}
          setSelectedRangeDate={setSelectedRangeDate} 
          isMatchInputWidth={true} 
          rangeType="range"
          pickType={"date"} 
          timeType="hour"
          // outputFormat="yyyy-MM-dd HH:00"
          onValueChange={(value) => {}} 
          />
      </div>
      <div style={{ paddingLeft: '1600px', paddingRight: '1600px', paddingTop: '1600px', paddingBottom: '1600px' }}>
        <div>
          single
        </div>
        <DatePickerWrapper
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isMatchInputWidth={true} 
          rangeType="single"
          pickType={"datetime"} 
          timeType="hour-minute-second"
          // outputFormat="yyyy-MM-dd HH:00"
          onValueChange={(value) => {}} 
          />
      </div>
    </div>
  );
}
