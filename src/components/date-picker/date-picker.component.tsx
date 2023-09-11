import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IDatePicker } from "./date-picker.interface";
import styles from './date-picker.module.css';
import { createPortal } from "react-dom";
import { useCalendar } from "../../..";
import { IUseCalendar } from "@/hooks/use-calendar/use-calendar.interface";
import { DateTime } from "luxon";

const portalElementId = `date-picker-root-portal`;
const spacing = 6;

export function DatePicker(props: IDatePicker.Props) {
  const {
    inputSelector,
    pickType,
    timeType,

    selectedDate,
    setSelectedDate,
    allowSelectDates,

    selectedRangeDate,
    setSelectedRangeDate,

    defaultValues,

    isShow,
    setIsShow,

    onValueChange,
    onRangeDateDiffDays,
    width,
  } = props;
  const isApplyFullSizeWhenDisplayEscape = useMemo(() => props.isApplyFullSizeWhenDisplayEscape ?? false, [props.isApplyFullSizeWhenDisplayEscape]);

  const isDefaultValuesForce = useMemo(() => defaultValues?.isForce ?? false, [defaultValues?.isForce]);

  const singleDefaultValueDay = useMemo(() => defaultValues?.single?.day, [defaultValues?.single?.day]);
  const singleDefaultValueHour = useMemo(() => defaultValues?.single?.hour, [defaultValues?.single?.hour]);
  const singleDefaultValueMinute = useMemo(() => defaultValues?.single?.minute, [defaultValues?.single?.minute]);
  const singleDefaultValueSecond = useMemo(() => defaultValues?.single?.second, [defaultValues?.single?.second]);
  const singleDefaultValueMillisecond = useMemo(() => defaultValues?.single?.millisecond, [defaultValues?.single?.millisecond]);

  const rangeStartDefaultValueDay = useMemo(() => defaultValues?.range?.start?.day, [defaultValues?.range?.start?.day]);
  const rangeStartDefaultValueHour = useMemo(() => defaultValues?.range?.start?.hour, [defaultValues?.range?.start?.hour]);
  const rangeStartDefaultValueMinute = useMemo(() => defaultValues?.range?.start?.minute, [defaultValues?.range?.start?.minute]);
  const rangeStartDefaultValueSecond = useMemo(() => defaultValues?.range?.start?.second, [defaultValues?.range?.start?.second]);
  const rangeStartDefaultValueMillisecond = useMemo(() => defaultValues?.range?.start?.millisecond, [defaultValues?.range?.start?.millisecond]);

  const rangeEndDefaultValueDay = useMemo(() => defaultValues?.range?.end?.day, [defaultValues?.range?.end?.day]);
  const rangeEndDefaultValueHour = useMemo(() => defaultValues?.range?.end?.hour, [defaultValues?.range?.end?.hour]);
  const rangeEndDefaultValueMinute = useMemo(() => defaultValues?.range?.end?.minute, [defaultValues?.range?.end?.minute]);
  const rangeEndDefaultValueSecond = useMemo(() => defaultValues?.range?.end?.second, [defaultValues?.range?.end?.second]);
  const rangeEndDefaultValueMillisecond = useMemo(() => defaultValues?.range?.end?.millisecond, [defaultValues?.range?.end?.millisecond]);

  const rangeType = useMemo<IDatePicker.RangeType>(() => props.rangeType ?? 'single', [props.rangeType]);
  const rangeDivideString = useMemo(() => props.rangeDivideString ?? '~', [props.rangeDivideString]);
  const [rangeDateControlTarget, setRangeDateControlTarget] = useState<IDatePicker.RangeDateControlTarget>('start');

  const prevInputRectInfo = useRef<DOMRect>();
  const disposeSizeAndPositionRequestAnimationFrame = useRef<number>();

  const getSystemOutputFormat = useCallback(() => {
    let timeFormat = ``;
    switch(timeType) {
      case 'hour': timeFormat = `HH`; break;
      case 'hour-minute': timeFormat = `HH:mm`; break;
      case 'hour-minute-second': timeFormat = `HH:mm:ss`; break;
    }
    if (timeType === undefined) {
      timeFormat = `HH:mm`;
    }

    switch(pickType) {
      case 'date': return `yyyy-MM-dd`;
      case 'datetime': return `yyyy-MM-dd ${timeFormat}`;
      case 'time': return timeFormat;
      case 'month': return `yyyy-MM`;
    }

    return ``;
  }, [pickType, timeType]);

  const outputFormat = useMemo(() => {
    if (typeof props.outputFormat === 'string') {
      return props.outputFormat;
    }

    return getSystemOutputFormat();
  }, [getSystemOutputFormat, props.outputFormat]);

  const [currentCalendarInfo, setCurrentCalendarInfo] = useState<IUseCalendar.CalendarInfo>();
  const calendar = useCalendar();

  const datePickerContainerRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [isExistPortal, setIsExistPortal] = useState<boolean>(false);

  const latestTypingDate = useRef<Date>();
  const prevValue = useRef('');
  
  const getInputElement = useCallback((): HTMLInputElement | null => {
    let element: HTMLInputElement | null = null;
    if (inputSelector?.ref !== undefined) {
      element = inputSelector.ref.current;
    } else if (typeof inputSelector?.selector === 'string') {
      element = document.querySelector<HTMLInputElement>(inputSelector.selector);
    } else if (inputSelector?.element !== undefined) {
      element = inputSelector.element;
    }
    return element;
  }, [inputSelector?.element, inputSelector?.ref, inputSelector?.selector]);

  const isBlockDate = useCallback((date: Date) => {
    if (allowSelectDates === undefined) return false;
    
    let isPassStart = false;
    if (allowSelectDates.startDate !== undefined) {
      const allowSelectDatesStartLuxonObj = DateTime.fromJSDate(allowSelectDates.startDate).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      if (date.getTime() >= allowSelectDatesStartLuxonObj.toJSDate().getTime()) {
        isPassStart = true;
      }
    }

    let isPassEnd = false;
    if (allowSelectDates.endDate !== undefined) {
      const allowSelectDatesEndLuxonObj = DateTime.fromJSDate(allowSelectDates.endDate).set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      if (date.getTime() <= allowSelectDatesEndLuxonObj.toJSDate().getTime()) {
        isPassEnd = true;
      }
    }

    if (allowSelectDates.startDate !== undefined && allowSelectDates.endDate === undefined) {
      return !isPassStart;
    }

    if (allowSelectDates.startDate === undefined && allowSelectDates.endDate !== undefined) {
      return !isPassEnd;
    }

    if (allowSelectDates.startDate === undefined && allowSelectDates.endDate === undefined) {
      return false;
    }

    return !(isPassStart && isPassEnd);
  }, [allowSelectDates]);

  const isSelectedMonthDate = useCallback((date: Date) => {
    if (rangeType === 'single') {
      return date.getFullYear() === selectedDate?.getFullYear() && date.getMonth() === selectedDate?.getMonth();
    }

    if (rangeType === 'range') {
      const start = selectedRangeDate?.start;
      const end = selectedRangeDate?.end;

      if (start !== undefined && end === undefined) {
        return date.getFullYear() === start?.getFullYear() && date.getMonth() === start?.getMonth();
      } else if (start === undefined && end !== undefined) {
        return date.getFullYear() === end?.getFullYear() && date.getMonth() === end?.getMonth();
      } else if (start !== undefined && end !== undefined) {
        const startDate = DateTime.fromJSDate(start).set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate();
        const endDate = DateTime.fromJSDate(end).endOf('month').set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate();
        return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
      }
    }

    return false;
  }, [rangeType, selectedDate, selectedRangeDate?.end, selectedRangeDate?.start]);

  const [inputWidth, setInputWidth] = useState<number>();
  const applyWidth = inputSelector?.isMatchInputWidth === true ? (inputWidth ?? 0) : (width ?? 0);
  const [direction, setDirection] = useState<IDatePicker.Direction>();
  const getDatePickerContainerStyle = useCallback((): CSSProperties | undefined => {
    if (direction === undefined) return undefined;
    if (direction.isFull !== true) {
      const elementClientXY = getElementClientXY(getInputElement());
      const windowWidth = getWindowWidth();
      const windowHeight = getWindowHeight();

      return {
        width: `${applyWidth}px`,
        top: (function(){
          if (direction.vertical === 'bottom') return `${(elementClientXY?.end.y ?? 0) + spacing}px`;
          return undefined;
        })(),
        bottom: (function(){
          if (direction.vertical === 'top') return `${windowHeight - (elementClientXY?.start.y ?? 0) + spacing}px`;
          return undefined;
        })(),
        left: (function(){
          if (direction.horizontal === 'left') return `${(elementClientXY?.start.x ?? 0)}px`;
          return undefined;
        })(),
        right: (function(){
          if (direction.horizontal === 'right') return `${windowWidth - (elementClientXY?.end.x ?? 0)}px`;
          return undefined;
        })(),
      };
    }
    return {
      width: `100vw`,
      height: `100vh`,
      top: 0,
      left: 0,
    };
  }, [applyWidth, direction, getInputElement]);

  function getWindowWidth() {
    if (typeof window === 'undefined') return 0;
    return Math.min(...[window.innerWidth, window.outerWidth]);
  }

  function getWindowHeight() {
    if (typeof window === 'undefined') return 0;
    return Math.min(...[window.innerHeight, window.outerHeight]);
  }

  const datePickerContainerClassName = useMemo<string>(() => {
    const classNames: string[] = [styles['date-picker-contaienr']];
    if (direction?.isFull === true) {
      classNames.push(styles['full']);
    }
    if (isShow === true) {
      classNames.push(styles['show']);
    }
    return classNames.join(' ');
  }, [direction?.isFull, isShow]);

  const resizeCallback = useRef(() => {
    disposeSizeAndPosition();
  });
  
  const inputFocusCallback = useRef(() => {
    if (typeof setIsShow === 'function') setIsShow(true);
  });

  const windowClickCallback = useRef((event: MouseEvent | TouchEvent) => {
    let clientX = 0;
    let clientY = 0;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    const pointElement = document.elementFromPoint(clientX, clientY);

    let currentElement = pointElement;
    let isThisExist = false;
    for (let i = 0; i < 20; i++) {
      if (currentElement === datePickerContainerRef.current || currentElement === getInputElement()) {
        isThisExist = true;
        break;
      }
      currentElement = currentElement?.parentElement ?? null;
    }

    if (!isThisExist) {
      if (typeof setIsShow === 'function') setIsShow(prev => false);
    }
  });

  function parsingTimeString(value: string) {
    if (typeof value !== 'string') return 'none' as const;
    
    if (value.length === 2) {
      return `HH` as const;
    }

    if (value.length === 5) {
      return `HH:mm` as const;
    }

    if (value.length === 8) {
      return `HH:mm:ss` as const;
    }

    return 'none' as const;
  }

  const inputOnChangeCallback = useRef((event: Event) => {
    latestTypingDate.current = new Date();
    let value = (event.target as any)?.value;
    if (typeof value !== 'string') { prevValue.current = value; return; }
    if (prevValue.current === value) return;

    const getConvertInfo = (_value: string) => {
      let isValid: boolean = false;
      let date: Date | undefined = undefined;

      let myValue = _value;
      if (pickType === 'time') {
        const parsingTimeType = parsingTimeString(myValue);
        switch(parsingTimeType) {
          case 'HH': myValue += ':00:00'; break;
          case 'HH:mm': myValue += ':00'; break;
        }
        myValue = `2023-09-09 ` + myValue;
      } else if (pickType === 'month') {
        const myValueSplit = myValue.split(' ');
        const firstString = myValue.split(' ')[0];
        if (myValueSplit.length === 1 && firstString.length === 7) {
          myValue += '-01';
        }
      }
      const luxonObj = DateTime.fromSQL(myValue);
      isValid = luxonObj.isValid;
      if (isValid) {
        date = luxonObj.toJSDate();
      }

      return {
        isValid,
        date,
      };  
    };

    if (rangeType === 'single') {
      const convertInfo = getConvertInfo(value);
      if (convertInfo.isValid) {
        setSelectedDateProxy(convertInfo.date);
        // if (typeof onSelect === 'function') onSelect(luxonObj.toJSDate(), luxonObj.toFormat(outputFormat));
      } 
      prevValue.current = value;
    }
    
    const disposeRange = () => {
      const valueSplit = value.split(rangeDivideString);
      if (valueSplit.length === 2) {
        const startValue = valueSplit[0].trim();
        const endValue = valueSplit[1].trim();

        const startValueConvertInfo = getConvertInfo(startValue);
        const endValueConvertInfo = getConvertInfo(endValue);

        let startDate = startValueConvertInfo.date;
        let endDate = endValueConvertInfo.date;

        const rangeDate: IDatePicker.RangeDate = {
          start: startDate,
          end: endDate,
        };

        if (rangeDate.start !== undefined && rangeDate.end !== undefined) {
          if (rangeDate.start.getTime() > rangeDate.end.getTime()) {
            rangeDate.start = rangeDate.end;
            if (typeof onValueChange === 'function') onValueChange(getRangeInputValue(rangeDate));
          }
        }

        setSelectedRangeDateProxy(rangeDate);
      }
    };

    if (rangeType === 'range') {
      disposeRange();
      prevValue.current = value;
    }
  });

  const finallySelectedDateInfo = useMemo<IUseCalendar.SelectedDate>(() => {
    if (rangeType === 'single') return selectedDate;
    if (rangeType === 'range') return selectedRangeDate;
    return undefined;
  }, [rangeType, selectedDate, selectedRangeDate]);

  const getRangeInputValue = useCallback((rangeDate: IDatePicker.RangeDate | undefined ): string => {
    if (rangeDate === undefined) return ``;

    let finallyValue: string = '';
    if (rangeDate.start !== undefined && rangeDate.end !== undefined) {
      finallyValue = `${DateTime.fromJSDate(rangeDate.start).toFormat(outputFormat)} ${rangeDivideString} ${DateTime.fromJSDate(rangeDate.end).toFormat(outputFormat)}`;
    } else if (rangeDate.start !== undefined && rangeDate.end === undefined) {
      finallyValue = `${DateTime.fromJSDate(rangeDate.start).toFormat(outputFormat)} ${rangeDivideString}`;
    } else if (rangeDate.start === undefined && rangeDate.end !== undefined) {
      finallyValue = `${rangeDivideString} ${DateTime.fromJSDate(rangeDate.end).toFormat(outputFormat)}`;
    }

    return finallyValue;
  }, [outputFormat, rangeDivideString]);

  if (typeof document !== 'undefined' && isExistPortal === false) {
    const portalElement = document.querySelector(`#${portalElementId}`);
    if (portalElement === null) {
      const element = document.createElement(`div`);
      element.id = portalElementId;
      document.body.appendChild(element);
    }
  }

  function getElementAbsoluteXY(element: HTMLElement | null) {
    if (element === null) return undefined;
    const rect = element.getBoundingClientRect();
    const startY = rect.top + window.scrollY;
    const startX = rect.left + window.scrollX;
    const endY = startY + rect.height;
    const endX = startX + rect.width;
    return { 
      start: {
        x: startX,
        y: startY,
      },
      end: {
        x: endX,
        y: endY,
      },
    };
  }

  function getElementClientXY(element: HTMLElement | null) {
    if (element === null) return undefined;
    const rect = element.getBoundingClientRect();
    const startY = rect.y;
    const startX = rect.x;
    const endY = startY + rect.height;
    const endX = startX + rect.width;
    return { 
      start: {
        x: startX,
        y: startY,
      },
      end: {
        x: endX,
        y: endY,
      },
    };
  }

  function disposeSizeAndPosition() {
    if (typeof window === 'undefined') return;
    // if (isShow !== true) return;

    const windowWidth = getWindowWidth();
    const windowHeight = getWindowHeight();

    const inputElement = getInputElement();
    if (inputElement === null) return;  
    setInputWidth(inputElement.getBoundingClientRect().width);

    const inputClientPosition = getElementClientXY(inputElement);
    if (inputClientPosition === undefined) return;

    const currentHeight = datePickerRef.current?.clientHeight ?? 0;

    const _direction: IDatePicker.Direction = {
      isFull: true,
    };

    // horizontal check
    if (inputClientPosition.start.x + applyWidth <= windowWidth && inputClientPosition.start.x >= 0 && inputClientPosition.end.x <= windowWidth) {
      _direction.horizontal = 'left';
    } else if (inputClientPosition.end.x - applyWidth >= 0 && inputClientPosition.start.x >= 0 && inputClientPosition.end.x <= windowWidth) {
      _direction.horizontal = 'right';
    }

    // vertical check
    if (inputClientPosition.end.y + currentHeight <= windowHeight && inputClientPosition.start.y >= 0 && inputClientPosition.end.y <= windowHeight) {
      _direction.vertical = 'bottom';
    } else if (inputClientPosition.start.y - currentHeight >= 0 && inputClientPosition.start.y >= 0 && inputClientPosition.end.y <= windowHeight) {
      _direction.vertical = 'top';
    }

    if (_direction.vertical !== undefined && _direction.horizontal !== undefined) {
      _direction.isFull = false;
    }

    if (_direction.isFull === true && !isApplyFullSizeWhenDisplayEscape) {
      _direction.isFull = false;
      _direction.horizontal = _direction.horizontal ?? 'left';
      _direction.vertical = _direction.vertical ?? 'bottom';
    }

    setDirection(_direction);
  }

  function setSelectedDateProxy(date: Date | undefined) {
    if (date === undefined) {
      if (typeof setSelectedDate === 'function') setSelectedDate(prev => undefined); 
      return;
    }

    let luxonObj = DateTime.fromJSDate(date);

    const systemOutputFormat = getSystemOutputFormat();
    if (systemOutputFormat === 'yyyy-MM-dd') {
      luxonObj = luxonObj.set({ hour: singleDefaultValueHour, minute: singleDefaultValueMinute, second: singleDefaultValueSecond, millisecond: singleDefaultValueMillisecond });
    } else if (systemOutputFormat === 'yyyy-MM') {
      if (singleDefaultValueDay === 'last-of-month') {
        luxonObj = luxonObj.endOf('month').set({ hour: luxonObj.hour, minute: luxonObj.minute, second: luxonObj.second, millisecond: luxonObj.millisecond });
      } else {
        luxonObj = luxonObj.set({ day: singleDefaultValueDay });
      }
      luxonObj = luxonObj.set({ hour: singleDefaultValueHour, minute: singleDefaultValueMinute, second: singleDefaultValueSecond, millisecond: singleDefaultValueMillisecond });
    } else if (systemOutputFormat === 'yyyy-MM-dd HH') {
      luxonObj = luxonObj.set({ minute: singleDefaultValueMinute, second: singleDefaultValueSecond, millisecond: singleDefaultValueMillisecond });
    } else if (systemOutputFormat === 'yyyy-MM-dd HH:mm') {
      luxonObj = luxonObj.set({ second: singleDefaultValueMinute, millisecond: singleDefaultValueMillisecond });
    }

    if (typeof setSelectedDate === 'function') setSelectedDate(prev => luxonObj.toJSDate()); 
  }

  function setSelectedRangeDateProxy(rangeDate: IDatePicker.RangeDate | undefined) {
    if (typeof rangeDate === undefined) {
      if (typeof setSelectedRangeDate === 'function') {
        setSelectedRangeDate(prev => undefined); 
      }
      return;
    }

    let startLuxonObj = rangeDate?.start !== undefined ? DateTime.fromJSDate(rangeDate?.start) : undefined;
    let endLuxonObj = rangeDate?.end !== undefined ? DateTime.fromJSDate(rangeDate?.end) : undefined;

    const systemOutputFormat = getSystemOutputFormat();

    if (startLuxonObj !== undefined) {
      if (systemOutputFormat === 'yyyy-MM-dd') {
        startLuxonObj = startLuxonObj.set({ hour: rangeStartDefaultValueHour, minute: rangeStartDefaultValueMinute, second: rangeStartDefaultValueSecond, millisecond: rangeStartDefaultValueMillisecond });
      } else if (systemOutputFormat === 'yyyy-MM') {
        if (rangeStartDefaultValueDay === 'last-of-month') {
          startLuxonObj = startLuxonObj.endOf('month').set({ hour: startLuxonObj.hour, minute: startLuxonObj.minute, second: startLuxonObj.second, millisecond: startLuxonObj.millisecond });
        } else {
          startLuxonObj = startLuxonObj.set({ day: rangeStartDefaultValueDay });
        }

        startLuxonObj = startLuxonObj.set({ hour: rangeStartDefaultValueHour, minute: rangeStartDefaultValueMinute, second: rangeStartDefaultValueSecond, millisecond: rangeStartDefaultValueMillisecond });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH') {
        startLuxonObj = startLuxonObj.set({ minute: rangeStartDefaultValueMinute, second: rangeStartDefaultValueSecond, millisecond: rangeStartDefaultValueMillisecond });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH:mm') {
        startLuxonObj = startLuxonObj.set({ second: rangeStartDefaultValueSecond, millisecond: rangeStartDefaultValueMillisecond });
      }
    }

    if (endLuxonObj !== undefined) {
      if (systemOutputFormat === 'yyyy-MM-dd') {
        endLuxonObj = endLuxonObj.set({ hour: rangeEndDefaultValueHour, minute: rangeEndDefaultValueMinute, second: rangeEndDefaultValueSecond, millisecond: rangeEndDefaultValueMillisecond });
      } else if (systemOutputFormat === 'yyyy-MM') {
        if (rangeEndDefaultValueDay === 'last-of-month') {
          endLuxonObj = endLuxonObj.endOf('month').set({ hour: endLuxonObj.hour, minute: endLuxonObj.minute, second: endLuxonObj.second, millisecond: endLuxonObj.millisecond });
        } else {
          endLuxonObj = endLuxonObj.set({ day: rangeEndDefaultValueDay });
        }

        endLuxonObj = endLuxonObj.set({ hour: rangeEndDefaultValueHour, minute: rangeEndDefaultValueMinute, second: rangeEndDefaultValueSecond, millisecond: rangeEndDefaultValueMillisecond });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH') {
        endLuxonObj = endLuxonObj.set({ minute: rangeEndDefaultValueMinute, second: rangeEndDefaultValueSecond, millisecond: rangeEndDefaultValueMillisecond });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH:mm') {
        endLuxonObj = endLuxonObj.set({ second: rangeEndDefaultValueSecond, millisecond: rangeEndDefaultValueMillisecond });
      }
    }

    if (typeof setSelectedRangeDate === 'function') setSelectedRangeDate(prev => ({ start: startLuxonObj?.toJSDate(), end: endLuxonObj?.toJSDate() }));
  }

  function getApplyForceDefaultValue(
    selectedDate: Date | undefined,
    defaultValueDay: IDatePicker.SingleDefaultDay | undefined,
    defaultValueHour: number | undefined,
    defaultValueMinute: number | undefined,
    defaultValueSecond: number | undefined,
    defaultValueMillisecond: number | undefined,
  ) {
    if (selectedDate === undefined) return undefined;

    let assingDefaultCount = 0;
    if (defaultValueDay !== undefined) assingDefaultCount++;
    if (defaultValueHour !== undefined) assingDefaultCount++;
    if (defaultValueMinute !== undefined) assingDefaultCount++;
    if (defaultValueSecond !== undefined) assingDefaultCount++;
    if (defaultValueMillisecond !== undefined) assingDefaultCount++;

    let passCount = 0;
    
    if (defaultValueDay !== undefined) {
      if (defaultValueDay === 'last-of-month') {
        if (selectedDate.getDate() === DateTime.fromJSDate(selectedDate).endOf('month').day) {
          passCount++;  
        }
      } else {
        if (selectedDate.getDate() === defaultValueDay) {
          passCount++;  
        }
      }
    } 

    if (defaultValueHour !== undefined) {
      if (selectedDate.getHours() === defaultValueHour) {
        passCount++;  
      }
    } 

    if (defaultValueMinute !== undefined) {
      if (selectedDate.getMinutes() === defaultValueMinute) {
        passCount++;  
      }
    } 

    if (defaultValueSecond !== undefined) {
      if (selectedDate.getSeconds() === defaultValueSecond) {
        passCount++;  
      }
    } 

    if (defaultValueMillisecond !== undefined) {
      if (selectedDate.getMilliseconds() === defaultValueMillisecond) {
        passCount++;  
      }
    } 

    if (passCount < assingDefaultCount) {
      let luxonObj = DateTime.fromJSDate(selectedDate);
      if (defaultValueDay === 'last-of-month') {
        luxonObj = luxonObj.endOf('month').set({
          hour: luxonObj.hour, 
          minute: luxonObj.minute,
          second: luxonObj.second,
          millisecond: luxonObj.millisecond,
        }).set({
          hour: defaultValueHour, 
          minute: defaultValueMinute,
          second: defaultValueSecond,
          millisecond: defaultValueMillisecond,
        });
      } else {
        luxonObj = luxonObj.set({ 
          day: defaultValueDay, 
          hour: defaultValueHour, 
          minute: defaultValueMinute,
          second: defaultValueSecond,
          millisecond: defaultValueMillisecond,
        });
      }

      const newDate = luxonObj.toJSDate();
      return newDate;
    } 

    return undefined;
  }

  useEffect(() => {
    if (isExistPortal !== true) return;

    if (isShow) {
      if (disposeSizeAndPositionRequestAnimationFrame.current !== undefined) {
        cancelAnimationFrame(disposeSizeAndPositionRequestAnimationFrame.current);
      }

      const call = (step: number) => {
        const currentInputRectInfo = getInputElement()?.getBoundingClientRect();
        if (prevInputRectInfo.current !== undefined && currentInputRectInfo !== undefined) {
          if (
            currentInputRectInfo.width !== prevInputRectInfo.current.width || 
            currentInputRectInfo.height !== prevInputRectInfo.current.height || 
            currentInputRectInfo.top !== prevInputRectInfo.current.top || 
            currentInputRectInfo.left !== prevInputRectInfo.current.left
          ) {
            disposeSizeAndPosition();      
          }
        }

        prevInputRectInfo.current = currentInputRectInfo;
        disposeSizeAndPositionRequestAnimationFrame.current = requestAnimationFrame(call);
      };

      disposeSizeAndPositionRequestAnimationFrame.current = requestAnimationFrame(call);
      disposeSizeAndPosition();
    } else {
      if (disposeSizeAndPositionRequestAnimationFrame.current !== undefined) {
        cancelAnimationFrame(disposeSizeAndPositionRequestAnimationFrame.current);
      }
    }

    return () => {
      if (disposeSizeAndPositionRequestAnimationFrame.current !== undefined) {
        cancelAnimationFrame(disposeSizeAndPositionRequestAnimationFrame.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShow, isExistPortal]);
  
  useEffect(() => {
    const callback = resizeCallback.current;
    callback();

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', callback);
      window.removeEventListener('scroll', callback);

      window.addEventListener('resize', callback);
      window.addEventListener('scroll', callback);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', callback);
        window.removeEventListener('scroll', callback);
      } 
    };
  }, []);

  useEffect(() => {
    const callback = windowClickCallback.current;
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', callback);
      window.addEventListener('click', callback);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', callback);
      } 
    };
  }, []); 

  useEffect(() => {
    if (rangeType === 'range') {
      if (isShow === true) {
        setRangeDateControlTarget('start');
        if (selectedRangeDate !== undefined) {
          setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedRangeDate.start ?? new Date(), selectedRangeDate));
        } else {
          setCurrentCalendarInfo(calendar.getDayCalendarInfo(new Date()));
        }
      } else {
        if (typeof onValueChange === 'function' && selectedRangeDate !== undefined) {
          onValueChange(getRangeInputValue(selectedRangeDate));
        }
      }
      return;
    }

    if (rangeType === 'single') {
      if (isShow === true) {
        if (selectedDate !== undefined) {
          setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedDate, selectedDate));
        } else {
          setCurrentCalendarInfo(calendar.getDayCalendarInfo(new Date()));
        }
      } else {
        if (typeof onValueChange === 'function' && selectedDate !== undefined) onValueChange(DateTime.fromJSDate(selectedDate).toFormat(outputFormat));
      }
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShow, rangeType]);

  useEffect(() => {
    const callback = inputFocusCallback.current;

    const inputElement = getInputElement();
    inputElement?.removeEventListener('focus', callback);
    inputElement?.addEventListener('focus', callback);

    return () => {
      inputElement?.removeEventListener('focus', callback);
    };
  }, [getInputElement]);

  useEffect(() => {
    const callback = inputOnChangeCallback.current;

    const inputElement = getInputElement();
    inputElement?.removeEventListener('keyup', callback);
    inputElement?.addEventListener('keyup', callback);

    return () => {
      inputElement?.removeEventListener('keyup', callback);
    };
  }, [getInputElement]);

  useEffect(() => {
    setIsExistPortal((function(){
      if (typeof document === 'undefined') return false;
      return document.querySelector(`#${portalElementId}`) !== undefined;
    })());
  }, []);

  useEffect(() => {
    if (rangeType === 'range') return;

    const isApplyValue = () => {
      if (latestTypingDate.current !== undefined) {
        if (Date.now() - latestTypingDate.current.getTime() <= 150) {
          return false;
        }
      }
      return true;
    };
    
    if (selectedDate === undefined) {
      setCurrentCalendarInfo(calendar.getDayCalendarInfo(new Date()));
      if (typeof onValueChange === 'function' && isApplyValue()) onValueChange('');
    } else {
      setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedDate, selectedDate));
      if (typeof onValueChange === 'function' && isApplyValue()) onValueChange(DateTime.fromJSDate(selectedDate).toFormat(outputFormat));

      if (isDefaultValuesForce) {
        const newDate = getApplyForceDefaultValue(selectedDate, singleDefaultValueDay, singleDefaultValueHour, singleDefaultValueMinute, singleDefaultValueSecond, singleDefaultValueMillisecond);
        if (newDate !== undefined) {
          setSelectedDateProxy(newDate);
          if (typeof onValueChange === 'function' && isApplyValue()) onValueChange(DateTime.fromJSDate(newDate).toFormat(outputFormat));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, rangeType]);

  useEffect(() => {
    if (rangeType === 'single') return;

    const isApplyValue = () => {
      if (latestTypingDate.current !== undefined) {
        if (Date.now() - latestTypingDate.current.getTime() <= 150) {
          return false;
        }
      }
      return true;
    };

    if (selectedRangeDate === undefined) {
      setCurrentCalendarInfo(calendar.getDayCalendarInfo(new Date()));
      if (typeof onValueChange === 'function' && isApplyValue()) onValueChange('');
    } else {

      let targetDate: Date = (selectedRangeDate.start ?? selectedRangeDate.end) ?? new Date();
      if (isShow === true) {
        targetDate = currentCalendarInfo?.currentDate ?? targetDate;
      }

      setCurrentCalendarInfo(calendar.getDayCalendarInfo(targetDate, selectedRangeDate));

      if (typeof onValueChange === 'function' && isApplyValue()) {
        onValueChange(getRangeInputValue(selectedRangeDate));
      }

      if (selectedRangeDate.start !== undefined && selectedRangeDate.end !== undefined) {
        const startLuxonObj = DateTime.fromJSDate(selectedRangeDate.start);
        const endLuxonObj = DateTime.fromJSDate(selectedRangeDate.end);
        const diff = endLuxonObj.diff(startLuxonObj, 'days').days;
        if (typeof onRangeDateDiffDays === 'function') onRangeDateDiffDays(Math.ceil(diff));
      } else {
        if (typeof onRangeDateDiffDays === 'function') onRangeDateDiffDays(undefined);
      }

      if (isDefaultValuesForce) {
        const newStartDate = getApplyForceDefaultValue(selectedRangeDate.start, rangeStartDefaultValueDay, rangeStartDefaultValueHour, rangeStartDefaultValueMinute, rangeStartDefaultValueSecond, rangeStartDefaultValueMillisecond);
        const newEndDate = getApplyForceDefaultValue(selectedRangeDate.end, rangeEndDefaultValueDay, rangeEndDefaultValueHour, rangeEndDefaultValueMinute, rangeEndDefaultValueSecond, rangeEndDefaultValueMillisecond);

        if (newStartDate !== undefined || newEndDate !== undefined) {
          const newRangeDate: IDatePicker.RangeDate = {
            start: newStartDate === undefined ? selectedRangeDate.start : newStartDate,
            end: newEndDate === undefined ? selectedRangeDate.end : newEndDate,
          };
          setSelectedRangeDateProxy(newRangeDate);
          if (typeof onValueChange === 'function' && isApplyValue()) {
            onValueChange(getRangeInputValue(newRangeDate));
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRangeDate, rangeType]);

  return (
    <>
      {
        isExistPortal === true ? 
        <Portal selector={`#${portalElementId}`}>
          <div 
            ref={datePickerContainerRef}
            className={datePickerContainerClassName}
            style={getDatePickerContainerStyle()}>
            <div
              className={styles['bg']}
              onClick={() => {
                setIsShow(prev => false);
              }}>
              
            </div>
            <div 
              ref={datePickerRef}
              className={[
                styles['date-picker'],
              ].join(' ')}>
              <div 
                className={[
                  styles['range-state-area'],
                  rangeType === 'range' ? '' : styles['hidden'],
                ].join(' ')}>
                <RangeItemContainer 
                  pickType={pickType}
                  timeType={timeType}
                  rangeDivideString={rangeDivideString}
                  outputFormat={outputFormat}
                  target="start"
                  isSelected={rangeDateControlTarget === 'start'}
                  selectedRangeDate={selectedRangeDate}
                  setSelectedRangeDateProxy={setSelectedRangeDateProxy}
                  onClick={() => {
                    setRangeDateControlTarget('start');
                    if (selectedRangeDate?.start !== undefined) {
                      setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedRangeDate?.start, selectedRangeDate));
                    }
                  }}
                  />
                <div style={{ width: '100%', height: '4px' }}></div>
                <RangeItemContainer 
                  pickType={pickType}
                  timeType={timeType}
                  rangeDivideString={rangeDivideString}
                  outputFormat={outputFormat}
                  target="end"
                  isSelected={rangeDateControlTarget === 'end'}
                  selectedRangeDate={selectedRangeDate}
                  setSelectedRangeDateProxy={setSelectedRangeDateProxy}
                  onClick={() => {
                    setRangeDateControlTarget('end');
                    if (selectedRangeDate?.end !== undefined) {
                      setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedRangeDate?.end, selectedRangeDate));
                    }
                  }}
                />
              </div>
              <div 
                className={[
                  styles['year-months-area'],
                  Array.from<IDatePicker.PickType>(['month']).includes(pickType) ? '' : styles['hidden'],
                ].join(' ')}>
                <div className={styles['top-row']}>
                  <div className={styles['move-to-month-button-icon-button']}
                    onClick={() => {
                      if (currentCalendarInfo?.prevYearDate !== undefined) {
                        setCurrentCalendarInfo(calendar.getDayCalendarInfo(currentCalendarInfo?.prevYearDate, finallySelectedDateInfo));
                      }
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles['move-to-month-button-icon']} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M15 6l-6 6l6 6"></path>
                    </svg>
                  </div>
                  <div className={styles['year-month-area']}>
                    { currentCalendarInfo?.currentYear }
                  </div>
                  <div className={styles['move-to-month-button-icon-button']}
                    onClick={() => {
                      if (currentCalendarInfo?.nextYearDate !== undefined) {
                        setCurrentCalendarInfo(calendar.getDayCalendarInfo(currentCalendarInfo?.nextYearDate, finallySelectedDateInfo));
                      }
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles['move-to-month-button-icon']} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M9 6l6 6l-6 6"></path>
                    </svg>
                  </div>
                </div>
                <div className={styles['month-list-area']}>
                  {
                    Array.from({ length: 12 }).map((item, index) => {
                      const luxonObj = DateTime.now().set({ year: currentCalendarInfo?.currentYear, month: index + 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, });
                      const date = luxonObj.toJSDate();
                      return (
                        <div
                          key={index}
                          className={[
                            isSelectedMonthDate(luxonObj.toJSDate()) ? styles['selected'] : '',
                            isBlockDate(date) ? styles['blocked'] : '',
                          ].join(' ')}
                          onClick={() => {
                            if (rangeType === 'single') {
                              setSelectedDateProxy(luxonObj.toJSDate());
                              if (typeof onValueChange === 'function') onValueChange(DateTime.fromJSDate(luxonObj.toJSDate()).toFormat(outputFormat));
                            }
                            
                            if (rangeType === 'range') {
                              if (selectedRangeDate === undefined) {
                                setSelectedRangeDateProxy(undefined);
                              } else {
                                let newSelectedRangeDate: IDatePicker.RangeDate | undefined;
                                if (rangeDateControlTarget === 'start') {
                                  let start: Date | undefined = undefined;
                                  if (selectedRangeDate.start !== undefined) {
                                    start = DateTime.fromJSDate(selectedRangeDate.start).set({ year: date.getFullYear(), month: date.getMonth() + 1 }).toJSDate();
                                    if (selectedRangeDate.end !== undefined) {
                                      if (start.getTime() > selectedRangeDate.end.getTime()) {
                                        console.error(`시작 월은 종료 월보다 이후일 수 없습니다.`);
                                        return;
                                      }
                                    }
                                  }

                                  newSelectedRangeDate = {
                                    start,
                                    end: selectedRangeDate.end,
                                  };
                                  setSelectedRangeDateProxy(newSelectedRangeDate);
                                } else if (rangeDateControlTarget === 'end') {
                                  let end: Date | undefined = undefined;
                                  if (selectedRangeDate.end !== undefined) {
                                    end = DateTime.fromJSDate(selectedRangeDate.end).set({ year: date.getFullYear(), month: date.getMonth() + 1 }).toJSDate();
                                    if (selectedRangeDate.start !== undefined) {
                                      if (selectedRangeDate.start.getTime() > end.getTime()) {
                                        console.error(`종료 월은 시작 월보다 이전일 수 없습니다.`);
                                        return;
                                      }
                                    }
                                  }
                                  newSelectedRangeDate = {
                                    start: selectedRangeDate.start,
                                    end,
                                  };
                                  setSelectedRangeDateProxy(newSelectedRangeDate);
                                }

                                if (typeof onValueChange === 'function') onValueChange(getRangeInputValue(newSelectedRangeDate));
                              }
                            }
                          }}
                          >
                          <div className={styles['wrapper']}>
                            { (index + 1) }월
                          </div>
                          <div 
                            className={[
                              styles['lock-icon-container'],
                              isBlockDate(date) ? '' : styles['hidden'],
                            ].join(' ')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={styles['lock-icon']} width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                              <path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z"></path>
                              <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"></path>
                              <path d="M8 11v-4a4 4 0 1 1 8 0v4"></path>
                            </svg>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
              <div 
                className={[
                  styles['year-month-dates-area'],
                  Array.from<IDatePicker.PickType>(['date', 'datetime']).includes(pickType) ? '' : styles['hidden'],
                ].join(' ')}>
                <div className={styles['top-row']}>
                  <div className={styles['move-to-month-button-icon-button']}
                    onClick={() => {
                      if (currentCalendarInfo?.prevMonthDate !== undefined) {
                        setCurrentCalendarInfo(calendar.getDayCalendarInfo(currentCalendarInfo?.prevMonthDate, finallySelectedDateInfo))
                      }
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles['move-to-month-button-icon']} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M15 6l-6 6l6 6"></path>
                    </svg>
                  </div>
                  <div className={styles['year-month-area']}>
                    { currentCalendarInfo?.currentYear }.{ currentCalendarInfo?.currentMonth.toString().padStart(2, '0') }
                  </div>
                  <div className={styles['move-to-month-button-icon-button']}
                    onClick={() => {
                      if (currentCalendarInfo?.nextMonthDate !== undefined) {
                        setCurrentCalendarInfo(calendar.getDayCalendarInfo(currentCalendarInfo?.nextMonthDate, finallySelectedDateInfo))
                      }
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles['move-to-month-button-icon']} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M9 6l6 6l-6 6"></path>
                    </svg>
                  </div>
                </div>
                <div className={styles['day-row']}>
                  <div>
                    일
                  </div>
                  <div>
                    월
                  </div>
                  <div>
                    화
                  </div>
                  <div>
                    수
                  </div>
                  <div>
                    목
                  </div>
                  <div>
                    금
                  </div>
                  <div>
                    토
                  </div>
                </div>
                <div className={styles['dates-area']}>
                  {
                    currentCalendarInfo?.dayItems.map(item => {
                      return (
                        <div key={item.yyyymmdd}
                          className={[
                            !item.isIncludeCurrentMonth ? styles['prev-or-next-month-date'] : '',
                            isBlockDate(item.date) ? styles['blocked'] : '',
                            item.isSelected ? styles['selected'] : '',
                          ].join(' ')}
                          onClick={() => {
                            if (isBlockDate(item.date)) {
                              return;
                            }

                            if (rangeType === 'single') {
                              // if (direction?.isFull === true) {
                              //   if (typeof setIsShow === 'function') setIsShow(prev => false);
                              // }
                              if (selectedDate === undefined) {
                                setSelectedDateProxy(DateTime.fromJSDate(item.date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate());  
                                if (typeof onValueChange === 'function') onValueChange(``);
                              } else {
                                setSelectedDateProxy(DateTime.fromJSDate(item.date).set({ hour: selectedDate?.getHours(), minute: selectedDate?.getMinutes(), second: selectedDate?.getSeconds() }).toJSDate());
                                if (typeof onValueChange === 'function') onValueChange(DateTime.fromJSDate(item.date).toFormat(outputFormat));
                              }
                            }

                            if (rangeType === 'range') {
                              // if (direction?.isFull === true) {
                              //   if (typeof setIsShow === 'function') setIsShow(prev => false);
                              // }
                              if (selectedRangeDate === undefined) {
                                if (rangeDateControlTarget === 'start') {
                                  const start: Date = DateTime.now().set({ year: item.dayInfo.year, month: item.dayInfo.month, day: item.dayInfo.day, hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate();
                                  const newSelectedRangeDate = {
                                    start,
                                    end: undefined,
                                  };
                                  setSelectedRangeDateProxy(newSelectedRangeDate);
                                  if (typeof onValueChange === 'function') onValueChange(getRangeInputValue(newSelectedRangeDate));
                                }
                                if (rangeDateControlTarget === 'end') {
                                  const end: Date = DateTime.now().set({ year: item.dayInfo.year, month: item.dayInfo.month, day: item.dayInfo.day, hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate();
                                  const newSelectedRangeDate = {
                                    start: undefined,
                                    end,
                                  };
                                  setSelectedRangeDateProxy(newSelectedRangeDate);
                                  if (typeof onValueChange === 'function') onValueChange(getRangeInputValue(newSelectedRangeDate));
                                }
                              } else {
                                let newSelectedRangeDate: IDatePicker.RangeDate | undefined;
                                if (rangeDateControlTarget === 'start') {
                                  let start: Date | undefined = undefined;
                                  if (selectedRangeDate.start !== undefined) {
                                    start = DateTime.fromJSDate(selectedRangeDate.start).set({ year: item.dayInfo.year, month: item.dayInfo.month, day: item.dayInfo.day }).toJSDate();
                                  } else {
                                    start = DateTime.now().set({ year: item.dayInfo.year, month: item.dayInfo.month, day: item.dayInfo.day, hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate();
                                  }

                                  if (selectedRangeDate.end !== undefined) {
                                    if (selectedRangeDate.end.getTime() < start.getTime()) {
                                      console.error(`시작 날짜는 종료 날짜보다 이후가 될 수 없습니다.`);
                                      return;
                                    }
                                  }

                                  newSelectedRangeDate = {
                                    start,
                                    end: selectedRangeDate.end,
                                  };
                                  setSelectedRangeDateProxy(newSelectedRangeDate);
                                } else if (rangeDateControlTarget === 'end') {
                                  let end: Date | undefined = undefined;
                                  if (selectedRangeDate.end !== undefined) {
                                    end = DateTime.fromJSDate(selectedRangeDate.end).set({ year: item.dayInfo.year, month: item.dayInfo.month, day: item.dayInfo.day }).toJSDate();
                                  } else {
                                    end = DateTime.now().set({ year: item.dayInfo.year, month: item.dayInfo.month, day: item.dayInfo.day, hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate();
                                  }

                                  if (selectedRangeDate.start !== undefined) {
                                    if (selectedRangeDate.start.getTime() > end.getTime()) {
                                      console.error(`종료 날짜는 시작 날짜보다 이전이 될 수 없습니다.`);
                                      return;
                                    }
                                  }

                                  newSelectedRangeDate = {
                                    start: selectedRangeDate.start,
                                    end,
                                  };
                                  setSelectedRangeDateProxy(newSelectedRangeDate);
                                }
                                if (typeof onValueChange === 'function') onValueChange(getRangeInputValue(newSelectedRangeDate));
                              }
                            }
                          }}>
                          <div className={styles['wrapper']}>
                            { item.dayInfo.day }
                            {
                              item.isToday ? 
                              <>
                                <span className={styles['today-symbol']}></span>
                              </>
                              : null
                            }
                          </div>
                          <div 
                            className={[
                              styles['lock-icon-container'],
                              isBlockDate(item.date) ? '' : styles['hidden'],
                            ].join(' ')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={styles['lock-icon']} width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                              <path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z"></path>
                              <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"></path>
                              <path d="M8 11v-4a4 4 0 1 1 8 0v4"></path>
                            </svg>
                          </div>  
                        </div>
                      );
                    })
                  }
                </div>
              </div>
              <div 
                className={[
                  styles['times-area'],
                  Array.from<IDatePicker.PickType>(['time', 'datetime']).includes(pickType) && rangeType === 'single' ? '' : styles['hidden'],
                ].join(' ')}>
                <div 
                  className={[
                    styles['time-block'],
                    Array.from<IDatePicker.TimeType>(['hour', 'hour-minute', 'hour-minute-second']).includes(timeType ?? '') ? '' : styles['hidden'],
                  ].join(' ')}>
                  <SelectBoxArrowIcon />
                  <select 
                    className={styles['select-box']} 
                    value={selectedDate?.getHours().toString().padStart(2, '0')}
                    onChange={(event) => {
                      const _value = event.target.value;
                      if (selectedDate === undefined) {
                        setSelectedDateProxy(undefined);
                      } else {
                        setSelectedDateProxy(DateTime.fromJSDate(selectedDate).set({ hour: Number(_value) }).toJSDate());
                      }
                    }}
                    >
                    {
                      Array.from({ length: 24 }).map((item, index) => {
                        return (
                          <option
                            key={index}
                            value={index.toString().padStart(2, '0')}>
                            { index.toString().padStart(2, '0') }시
                          </option>
                        );
                      })
                    }
                  </select>
                </div>  
                <div 
                  className={[
                    styles['time-block'],
                    Array.from<IDatePicker.TimeType>(['hour-minute', 'hour-minute-second']).includes(timeType ?? '') ? '' : styles['hidden'],
                  ].join(' ')}>
                  <SelectBoxArrowIcon />
                  <select 
                    className={styles['select-box']} 
                    value={selectedDate?.getMinutes().toString().padStart(2, '0')}
                    onChange={(event) => {
                      const _value = event.target.value;
                      if (selectedDate === undefined) {
                        setSelectedDateProxy(undefined);
                      } else {
                        setSelectedDateProxy(DateTime.fromJSDate(selectedDate).set({ minute: Number(_value) }).toJSDate());
                      }
                    }}
                    >
                    {
                      Array.from({ length: 60 }).map((item, index) => {
                        return (
                          <option
                            key={index}
                            value={index.toString().padStart(2, '0')}>
                            { index.toString().padStart(2, '0') }분
                          </option>
                        );
                      })
                    }
                  </select>
                </div>
                <div 
                  className={[
                    styles['time-block'],
                    Array.from<IDatePicker.TimeType>(['hour-minute-second']).includes(timeType ?? '') ? '' : styles['hidden'],
                  ].join(' ')}>
                  <SelectBoxArrowIcon />
                  <select 
                    className={styles['select-box']} 
                    value={selectedDate?.getSeconds().toString().padStart(2, '0')}
                    onChange={(event) => {
                      const _value = event.target.value;
                      if (selectedDate === undefined) {
                        setSelectedDateProxy(undefined);
                      } else {
                        setSelectedDateProxy(DateTime.fromJSDate(selectedDate).set({ second: Number(_value) }).toJSDate());
                      }
                    }}
                    >
                    {
                      Array.from({ length: 60 }).map((item, index) => {
                        return (
                          <option
                            key={index}
                            value={index.toString().padStart(2, '0')}>
                            { index.toString().padStart(2, '0') }초
                          </option>
                        );
                      })
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Portal>
        : null
      }      
      <div className=""></div>
    </>
  );
}

function SelectBoxArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={styles['select-box-arrow-icon']} width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M6 10l6 6l6 -6h-12"></path>
    </svg>
  );
}

function RangeItemContainer(props: IDatePicker.RangeItemContainerProps) {
  const {
    target,
    pickType,
    timeType,
    outputFormat,
    isSelected,
    onClick,
    selectedRangeDate,
    setSelectedRangeDateProxy,
  } = props;

  const layoutType = useMemo<IDatePicker.RangeItemContainerLayoutType>(() => {
    switch(pickType) {
      case 'month': return 'month';
      case 'date': return 'date';
      case 'datetime': {
        switch(timeType) {
          case 'hour': return 'datetime-hour';
          case 'hour-minute': return 'datetime-hour-minute';
          case 'hour-minute-second': return 'datetime-hour-minute-second';
        }
      };
      case 'time': {
        switch(timeType) {
          case 'hour': return 'time-hour';
          case 'hour-minute': return 'time-hour-minute';
          case 'hour-minute-second': return 'time-hour-minute-second';
        }
      };
    }
    return '';
  }, [pickType, timeType]);

  const selectedDate = useMemo(() => {
    return target === 'start' ? selectedRangeDate?.start : selectedRangeDate?.end;
  }, [selectedRangeDate?.end, selectedRangeDate?.start, target]);

  const getDateValue = useCallback((): string => {
    if (selectedRangeDate === undefined) return ``;
    if (selectedDate === undefined) return ``;
    const luxonObj = DateTime.fromJSDate(selectedDate);
    let format = '';
    if (pickType === 'month') {
      format = `yyyy-MM`;
    } else if (pickType === 'date' || pickType === 'datetime') {
      format = `yyyy-MM-dd`;
    }
    return luxonObj.toFormat(format);
  }, [selectedRangeDate, selectedDate, pickType]);

  return (
    <>
      <div 
        className={[
          styles['range-item-container'],
          styles[layoutType],
          isSelected ? styles['selected'] : '',
        ].join(' ')} 
        onClick={onClick}
        >
        <span className={styles['label']}>
          { target === 'start' ? '시작' : '종료' }&nbsp;:
        </span>
        <input 
          className={styles['date-input']}
          type="text" 
          readOnly={true} 
          value={getDateValue()}
          />
        <div
          className={styles['time-unit-list']}>
          <div 
            className={[
              styles['time-block'],
              styles['hour-block'],
            ].join(' ')}>
            <SelectBoxArrowIcon />
            <select 
              className={styles['select-box']} 
              value={selectedDate?.getHours().toString().padStart(2, '0')}
              onChange={(event) => {
                const _value = event.target.value;
                if (selectedDate === undefined) {
                  setSelectedRangeDateProxy(undefined);
                  return;
                } 

                if (target === 'start') {
                  let start: Date | undefined = undefined; 
                  if (selectedRangeDate?.start !== undefined) {
                    start = DateTime.fromJSDate(selectedDate).set({ hour: Number(_value) }).toJSDate();
                  }
                  setSelectedRangeDateProxy({
                    start,
                    end: selectedRangeDate?.end,
                  });
                } else if (target === 'end') {
                  let end: Date | undefined = undefined; 
                  if (selectedRangeDate?.end !== undefined) {
                    end = DateTime.fromJSDate(selectedDate).set({ hour: Number(_value) }).toJSDate();
                  }
                  setSelectedRangeDateProxy({
                    start: selectedRangeDate?.start,
                    end,
                  });
                }
              }}
              >
              {
                Array.from({ length: 24 }).map((item, index) => {
                  return (
                    <option
                      key={index}
                      value={index.toString().padStart(2, '0')}>
                      { index.toString().padStart(2, '0') }시
                    </option>
                  );
                })
              }
            </select>
          </div>  
          <div 
            className={[
              styles['time-block'],
              styles['minute-block'],
              // Array.from<IDatePicker.TimeType>(['hour-minute', 'hour-minute-second']).includes(timeType ?? '') ? '' : styles['hidden'],
            ].join(' ')}>
            <SelectBoxArrowIcon />
            <select 
              className={styles['select-box']} 
              value={selectedDate?.getMinutes().toString().padStart(2, '0')}
              onChange={(event) => {
                const _value = event.target.value;
                if (selectedDate === undefined) {
                  setSelectedRangeDateProxy(undefined);
                  return;
                } 

                if (target === 'start') {
                  let start: Date | undefined = undefined; 
                  if (selectedRangeDate?.start !== undefined) {
                    start = DateTime.fromJSDate(selectedDate).set({ minute: Number(_value) }).toJSDate();
                  }
                  setSelectedRangeDateProxy({
                    start,
                    end: selectedRangeDate?.end,
                  });
                } else if (target === 'end') {
                  let end: Date | undefined = undefined; 
                  if (selectedRangeDate?.end !== undefined) {
                    end = DateTime.fromJSDate(selectedDate).set({ minute: Number(_value) }).toJSDate();
                  }
                  setSelectedRangeDateProxy({
                    start: selectedRangeDate?.start,
                    end,
                  });
                }
              }}
              >
              {
                Array.from({ length: 60 }).map((item, index) => {
                  return (
                    <option
                      key={index}
                      value={index.toString().padStart(2, '0')}>
                      { index.toString().padStart(2, '0') }분
                    </option>
                  );
                })
              }
            </select>
          </div>
          <div 
            className={[
              styles['time-block'],
              styles['second-block'],
              // Array.from<IDatePicker.TimeType>(['hour-minute-second']).includes(timeType ?? '') ? '' : styles['hidden'],
            ].join(' ')}>
            <SelectBoxArrowIcon />
            <select 
              className={styles['select-box']} 
              value={selectedDate?.getSeconds().toString().padStart(2, '0')}
              onChange={(event) => {
                const _value = event.target.value;
                if (selectedDate === undefined) {
                  setSelectedRangeDateProxy(undefined);
                  return;
                } 

                if (target === 'start') {
                  let start: Date | undefined = undefined; 
                  if (selectedRangeDate?.start !== undefined) {
                    start = DateTime.fromJSDate(selectedDate).set({ second: Number(_value) }).toJSDate();
                  }
                  setSelectedRangeDateProxy({
                    start,
                    end: selectedRangeDate?.end,
                  });
                } else if (target === 'end') {
                  let end: Date | undefined = undefined; 
                  if (selectedRangeDate?.end !== undefined) {
                    end = DateTime.fromJSDate(selectedDate).set({ second: Number(_value) }).toJSDate();
                  }
                  setSelectedRangeDateProxy({
                    start: selectedRangeDate?.start,
                    end,
                  });
                }
              }}
              >
              {
                Array.from({ length: 60 }).map((item, index) => {
                  return (
                    <option
                      key={index}
                      value={index.toString().padStart(2, '0')}>
                      { index.toString().padStart(2, '0') }초
                    </option>
                  );
                })
              }
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

function Portal(props: { children: ReactNode, selector: string }) {
  const { children, selector } = props;
  const element = typeof window !== "undefined" && document.querySelector(selector);
  return element && children ? createPortal(children, element) : null;
};