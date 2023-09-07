import { Dispatch, RefObject, SetStateAction } from "react";

export declare namespace IDatePicker {
  export type VerticalDirection = 'top' | 'bottom';
  export type HorizontalDirection = 'left' | 'right';
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

  export interface Props {
    inputSelector?: InputSelector;

    selectedDateObj?: Date;
    setSelectedDateObj?: Dispatch<SetStateAction<Date | undefined>>;

    isShow?: boolean;
    setIsShow?: Dispatch<SetStateAction<boolean | undefined>>;

    width?: number;
  }
}