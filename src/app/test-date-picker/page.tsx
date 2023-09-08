"use client"
import { DatePicker } from "@/components/date-picker/date-picker.component";
import { useRef, useState } from "react";

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  
  const [value, setValue] = useState<string>('');
  const [isShow, setIsShow] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [value2, setValue2] = useState<string>('');
  const [isShow2, setIsShow2] = useState<boolean>(false);
  const [selectedDate2, setSelectedDate2] = useState<Date | undefined>(new Date());

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
        <div className="w-full relative">
          <button
            className="w-[200px]"
            onClick={() => {
              setSelectedDate(new Date('2023-06-06 06:11:11'))
            }}>
            프로그래밍 방식으로 바꾸기
          </button>
        </div>
        <br />
        <div>
          <input
            ref={inputRef2}
            style={{ width: '260px' }}
            value={value2}
            onChange={e => {
              const _value = e.target.value;
              setValue2(_value);
            }}
            type="text"
            className="border border-slate-700 box-border" />
        </div>
      </div>
      
      <DatePicker 
        inputSelector={{
          ref: inputRef,
          isMatchInputWidth: true,
        }}
        pickTypes={['date', 'time']}
        // isTimeAllowSecondPick={true}
        isShow={isShow}
        setIsShow={setIsShow}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        // outputFormat="yyyy-MM-dd"
        onValueChange={(value) => {
          setValue(value);
        }}
        // width={360}
        />

      <DatePicker 
        inputSelector={{
          ref: inputRef2,
          isMatchInputWidth: true,
        }}
        pickTypes={['date']}
        isTimeAllowSecondPick={true}
        isShow={isShow2}
        setIsShow={setIsShow2}
        selectedDate={selectedDate2}
        setSelectedDate={setSelectedDate2}
        // outputFormat="yyyy-MM-dd"
        onValueChange={(value) => {
          setValue2(value);
        }}
        // width={360}
        />
    </div>
  );
}
