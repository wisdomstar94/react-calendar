import { useRef, useState } from "react";
import { IDatePickerWrapper } from "./date-picker-wrapper.interface";
import { DatePicker } from "../date-picker/date-picker.component";

export function DatePickerWrapper(props: IDatePickerWrapper.Props) {
  const {
    isMatchInputWidth,
    width,
    pickType,
    timeType,
    rangeType,
    rangeDivideString,
    defaultValues,
    selectedDate,
    setSelectedDate,
    selectedRangeDate,
    setSelectedRangeDate,
    allowSelectDates,
    outputFormat,
    onValueChange,
    onRangeDateDiffDays,
  } = props;

  const [value, setValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isShow, setIsShow] = useState<boolean>(false);

  return (
    <>
      {/* 이 input 태그를 커스텀 하셔도 되고, input 컴포넌트를 대체하여 사용하셔도 됩니다. 다만 input 컴포넌트를 사용하실 경우 value 와 ref 를 받을 수 있는 prop 이 필수로 있어야 합니다. */}
      <input
        className="w-[300px] border border-slate-500 px-2 py-1 text-sm"
        ref={inputRef}
        placeholder="날짜를 선택하세요."
        value={value}
        onChange={e => setValue(e.target.value)} />

      <DatePicker 
        inputSelector={{
          ref: inputRef,
          isMatchInputWidth,
        }}
        pickType={pickType}
        timeType={timeType}
        rangeType={rangeType}
        rangeDivideString={rangeDivideString}
        isShow={isShow}
        setIsShow={setIsShow}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedRangeDate={selectedRangeDate}
        setSelectedRangeDate={setSelectedRangeDate}
        allowSelectDates={allowSelectDates}
        outputFormat={outputFormat}
        defaultValues={defaultValues}
        onValueChange={(value) => {
          setValue(value);
          onValueChange(value);
        }}
        onRangeDateDiffDays={(dayCount) => {
          if (typeof onRangeDateDiffDays === 'function') onRangeDateDiffDays(dayCount);
        }}
        width={width}
        />
    </>
  );
}