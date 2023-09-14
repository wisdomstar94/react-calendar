"use client"

import { DatePickerWrapper } from "@/components/date-picker-wrapper/date-picker-wrapper.component";
import { IDatePicker } from "@/components/date-picker/date-picker.interface";
import { useEffect, useState } from "react";

export default function Page() {
  const [selectedRangeDate, setSelectedRangeDate] = useState<IDatePicker.RangeDate>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [init, setInit] = useState<boolean>(false);

  const [pickType, setPickType] = useState<IDatePicker.PickType>('datetime');
  const [outputFormat, setOutputFormat] = useState<string>();

  useEffect(() => {
    // console.log(`@@@selectedRangeDate`, selectedRangeDate);
  }, [selectedRangeDate]);

  useEffect(() => {
    // console.log(`@@@selectedDate`, selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setInit(true);
  }, []);

  useEffect(() => {
    if (init === false) return;

    setSelectedRangeDate({
      start: new Date(`2023-02-04 02:11:22`),
      end: new Date(`2023-09-22 23:33:44`),
    });

    setSelectedDate(new Date(`2023-08-04 03:55:55`));

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
        {/* <div>
          pickType :
          <select value={pickType ?? ''} onChange={e => {
            const value = e.target.value as IDatePicker.PickType;
            setPickType(value);
          }}>
            <option value="">선택</option>
            <option value="date">date</option>
            <option value="datetime">datetime</option>
            <option value="month">month</option>
          </select>
        </div>
        <div>
          outputFormat :
          <select value={outputFormat ?? ''} onChange={e => {
            const value = e.target.value;
            setOutputFormat(value);
          }}>
            <option value="">선택</option>
            <option value="yyyy-MM-dd HH:mm:ss">yyyy-MM-dd HH:mm:ss</option>
            <option value="yyyy-MM-dd HH:mm">yyyy-MM-dd HH:mm</option>
            <option value="yyyy-MM-dd HH:00">yyyy-MM-dd HH:00</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
            <option value="yyyy-MM">yyyy-MM</option>
          </select>
        </div> */}
        <DatePickerWrapper
          selectedRangeDate={selectedRangeDate}
          setSelectedRangeDate={setSelectedRangeDate} 
          isMatchInputWidth={true} 
          rangeType="range"
          // pickType={"month"}
          pickType="datetime"
          // timeType="hour"
          isApplyFullSizeWhenDisplayEscape={false}
          rangeDivideString={'-->'}
          // outputFormat='yyyy-'
          // isCalendarPickAutoClose={(params) => {
          //   return false;
          // }}
          allowSelectDates={{
            start: { year: 2023, month: 9, day: 3 },
            end: { year: 2023, month: 9, day: 22 },
          }}
          defaultValues={{
            // isForce: false,
            range: {
              start: {
                day: 1,
                hour: 0, 
                minute: 0, 
                second: 0, 
                millisecond: 0,
              },
              end: {
                day: 'last-of-month',
                hour: 23, 
                minute: 59, 
                second: 59, 
                millisecond: 999,
              },
            },
          }}
          // width={400}
          onValueChange={(value) => {}} 
          onRangeDateDiffDays={(dayCount) => {
            // console.log('@dayCount', dayCount);
          }}
          onEscapeAllowSelectDates={(escapedDateInfo) => {
            // console.log(`@escapedDateInfo`, escapedDateInfo);
          }}
          />
      </div>
      <div style={{ paddingLeft: '1600px', paddingRight: '1600px', paddingTop: '1600px', paddingBottom: '1600px' }}>
        <div>
          single
        </div>
        <div>
          pickType :
          <select value={pickType} onChange={e => {
            const value = e.target.value as IDatePicker.PickType;
            setPickType(value);
          }}>
            <option value="date">date</option>
            <option value="datetime">datetime</option>
            <option value="month">month</option>
            <option value="time">time</option>
          </select>
        </div>
        {/* 
        <div>
          outputFormat :
          <select value={outputFormat} onChange={e => {
            const value = e.target.value;
            setOutputFormat(value);
          }}>
            <option value="yyyy-MM-dd HH:mm:ss">yyyy-MM-dd HH:mm:ss</option>
            <option value="yyyy-MM-dd HH:mm">yyyy-MM-dd HH:mm</option>
            <option value="yyyy-MM-dd HH:00">yyyy-MM-dd HH:00</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
            <option value="yyyy-MM">yyyy-MM</option>
          </select>
        </div> */}
        <DatePickerWrapper
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isMatchInputWidth={true} 
          isApplyFullSizeWhenDisplayEscape={true}
          rangeType="single"
          pickType={pickType} 
          timeType="hour"
          // outputFormat={"yyyy-MM-dd HH:00"}
          // isCalendarPickAutoClose={(params) => {
          //   return false;
          // }}
          allowSelectDates={{
            start: { year: 2023, month: 9, day: 3 },
            end: { year: 2023, month: 9, day: 22 },
          }}
          defaultValues={{
            // isForce: true,
            single: {
              day: 'last-of-month',
              hour: 0, 
              minute: 48, 
              second: 48, 
              // millisecond: 999,
            },
          }}
          // outputFormat="yyyy-MM-dd HH:00"
          onValueChange={(value) => {}} 
          onEscapeAllowSelectDates={(escapedDateInfo) => {
            console.log(`@escapedDateInfo`, escapedDateInfo);
          }}
          />
      </div>
    </div>
  );
}
