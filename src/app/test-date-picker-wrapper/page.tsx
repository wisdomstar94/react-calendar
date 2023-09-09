"use client"

import { DatePickerWrapper } from "@/components/date-picker-wrapper/date-picker-wrapper.component";
import { IDatePicker } from "@/components/date-picker/date-picker.interface";
import { useEffect, useState } from "react";

export default function Page() {
  const [selectedRangeDate, setSelectedRangeDate] = useState<IDatePicker.RangeDate>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [init, setInit] = useState<boolean>(false);

  useEffect(() => {
    console.log(`@@@selectedRangeDate`, selectedRangeDate);
  }, [selectedRangeDate]);

  useEffect(() => {
    console.log(`@@@selectedDate`, selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setInit(true);
  }, []);

  useEffect(() => {
    if (init === false) return;

    setSelectedRangeDate({
      start: new Date(`2023-02-04 02:02:02`),
      end: new Date(`2023-09-22 11:12:03`),
    });

    setSelectedDate(new Date(`2023-09-04 03:44:55`));

    // setTimeout(() => {
    //   setSelectedRangeDate({
    //     start: new Date(`2023-10-09`),
    //     end: new Date(`2023-11-23`),
    //   });

    //   setSelectedDate(new Date(`2023-11-23 11:14:48`));
    // }, 5000);
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
          pickType={"datetime"} 
          timeType="hour-minute"
          isApplyFullSizeWhenDisplayEscape={true}
          rangeDivideString={'-->'}
          // outputFormat="yyyy-MM-dd HH:00"
          // defaultValues={{
          //   isForce: true,
          //   range: {
          //     start: {
          //       day: 1,
          //       hour: 0, 
          //       // minute: 0, 
          //       second: 0, 
          //       millisecond: 0,
          //     },
          //     end: {
          //       day: 'last-of-month',
          //       hour: 23, 
          //       // minute: 59, 
          //       second: 59, 
          //       millisecond: 999,
          //     },
          //   },
          // }}
          onValueChange={(value) => {}} 
          onRangeDateDiffDays={(dayCount) => {
            console.log('@dayCount', dayCount);
          }}
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
          isApplyFullSizeWhenDisplayEscape={true}
          rangeType="single"
          pickType={"datetime"} 
          timeType="hour-minute-second"
          defaultValues={{
            isForce: true,
            single: {
              day: 'last-of-month',
              hour: 0, 
              // minute: 0, 
              second: 0, 
              millisecond: 0,
            },
          }}
          // outputFormat="yyyy-MM-dd HH:00"
          onValueChange={(value) => {}} 
          />
      </div>
    </div>
  );
}
