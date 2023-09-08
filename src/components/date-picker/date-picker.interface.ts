import { Dispatch, RefObject, SetStateAction } from "react";

export declare namespace IDatePicker {
  export type VerticalDirection = 'top' | 'bottom';
  export type HorizontalDirection = 'left' | 'right';

  export type RangeType = 'range' | 'single';

  export type PickType = 
    'month' | 
    'time' | 
    'date' | 
    'datetime' |
    ''
  ;

  export type TimeType = 
    'hour' |
    'hour-minute' |
    'hour-minute-second' |
    ''
  ;

  // export interface TimeSetting {
  //   allowHour: true;
  //   allowMinute?: boolean;
  //   allowSecond?: boolean;
  // }
  // export interface DateSetting {
  //   allowYear?: boolean;
  //   allowMonth?: boolean;
  // }
  // export interface PickType {
  //   date?: DateSetting;
  //   time?: TimeSetting;
  // }

  export interface TimeSetting {
    allowHour: true;
    allowMinute?: boolean;
    allowSecond?: boolean;
  }

  export interface Direction {
    isFull: boolean;
    vertical?: VerticalDirection;
    horizontal?: HorizontalDirection;
  }

  export interface InputSelector {
    /** 우선 순위 (1) */
    ref?: RefObject<HTMLInputElement>;
    /** 우선 순위 (2) */
    selector?: string;
    /** 우선 순위 (3) */
    element?: HTMLInputElement | null;

    isMatchInputWidth: boolean;
  }

  export interface ResizeOrScrollInfo {
    date: Date;
  }

  export interface RangeDate {
    start: Date | undefined;
    end: Date | undefined;
  }

  export interface AllowSelectDates {
    startDate?: Date;
    endDate?: Date;
  }

  export type SingleDefaultDay = number | 'last-of-month';

  export interface SingleDefaultValues {
    day?: SingleDefaultDay;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
  }

  export interface RangeDefaultValues {
    start?: SingleDefaultValues;
    end?: SingleDefaultValues;
  }

  export interface DefaultValues {
    single?: SingleDefaultValues;
    range?: RangeDefaultValues;
    isForce?: boolean;
  }

  export interface Props {
    inputSelector?: InputSelector;
    pickType: PickType;
    // isTimeAllowSecondPick?: boolean;
    timeType?: TimeType;
    rangeType?: RangeType;
    rangeDivideString?: string;

    selectedDate?: Date | undefined;
    setSelectedDate?: Dispatch<SetStateAction<Date | undefined>>;

    selectedRangeDate?: RangeDate;
    setSelectedRangeDate?: Dispatch<SetStateAction<RangeDate | undefined>>;

    defaultValues?: DefaultValues;

    isShow: boolean;
    setIsShow: Dispatch<SetStateAction<boolean>>;

    // onSelect?: (date: Date | undefined, outputString: string) => void;
    onValueChange: (value: string) => void;
    onRangeDateDiffDays?: (dayCount: number | undefined) => void;
    
    outputFormat?: string;
      
    allowSelectDates?: AllowSelectDates;
    width?: number;
  }

  export type RangeItemContainerLayoutType =
    'month' | 
    'date' | 
    'datetime-hour' | 
    'datetime-hour-minute' | 
    'datetime-hour-minute-second' | 
    'time-hour' | 
    'time-hour-minute' | 
    'time-hour-minute-second' | 
    ''
  ;

  export type RangeDateControlTarget = 'start' | 'end';

  export interface RangeItemContainerProps {
    target: RangeDateControlTarget;
    rangeDivideString: string;
    pickType: PickType;
    timeType: TimeType | undefined;
    outputFormat: string;
    isSelected: boolean;
    onClick: () => void;
    selectedRangeDate: undefined | RangeDate;
    setSelectedRangeDateProxy: (rangeDate: IDatePicker.RangeDate | undefined) => void;
  }
}