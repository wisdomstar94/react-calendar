"use client"
import { DatePicker } from "@/components/date-picker/date-picker.component";
import { useRef, useState } from "react";

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string>('');
  const [isShow, setIsShow] = useState<boolean>();
  const [selectedDate, setSelectedDate] = useState<Date>();

  return (
    <div>
      <div style={{ paddingLeft: '1600px', paddingRight: '1600px', paddingTop: '1600px', paddingBottom: '1600px' }}>
        <input
          ref={inputRef}
          style={{ width: '260px' }}
          value={value}
          onChange={e => {
            const _value = e.target.value;
            setValue(_value);
          }}
          type="text"
          className="border border-slate-700 box-border" />
      </div>
      
      <DatePicker 
        inputSelector={{
          ref: inputRef,
          isMatchInputWidth: true,
        }}
        isShow={isShow}
        setIsShow={setIsShow}
        selectedDateObj={selectedDate}
        setSelectedDateObj={setSelectedDate}
        onSelect={(date, outputString) => {
          setValue(outputString);
        }}
        // width={360}
        />
    </div>
  );
}
