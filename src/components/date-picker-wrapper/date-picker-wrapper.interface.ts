import { Dispatch, SetStateAction } from "react";
import { IDatePicker } from "../date-picker/date-picker.interface";

export declare namespace IDatePickerWrapper {
  export interface Props {
    isMatchInputWidth: boolean;
    width?: number;
    pickType: IDatePicker.PickType;
    timeType?: IDatePicker.TimeType;
    rangeType?: IDatePicker.RangeType;
    rangeDivideString?: string;

    selectedDate?: Date;
    setSelectedDate?: Dispatch<SetStateAction<Date | undefined>>;

    selectedRangeDate?: IDatePicker.RangeDate;
    setSelectedRangeDate?: Dispatch<SetStateAction<IDatePicker.RangeDate | undefined>>;

    allowSelectDates?: IDatePicker.AllowSelectDates;
    outputFormat?: string;
    onValueChange: (value: string) => void;
  }
}