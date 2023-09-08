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

    isShow,
    setIsShow,

    onValueChange,
    width,
  } = props;
  // const isTimeAllowSecondPick = useMemo(() => props.isTimeAllowSecondPick ?? false, [props.isTimeAllowSecondPick]);
  const rangeType = useMemo<IDatePicker.RangeType>(() => props.rangeType ?? 'single', [props.rangeType]);
  const [rangeDateControlTarget, setRangeDateControlTarget] = useState<IDatePicker.RangeDateControlTarget>('start');
    
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
  const [resizeOrscrollInfo, setResizeOrscrollInfo] = useState<IDatePicker.ResizeOrScrollInfo>();
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
    return date.getFullYear() === selectedDate?.getFullYear() && date.getMonth() === selectedDate?.getMonth();
  }, [selectedDate]);

  const [inputWidth, setInputWidth] = useState<number>();
  const applyWidth = inputSelector?.isMatchInputWidth === true ? (inputWidth ?? 0) : (width ?? 0);
  const [direction, setDirection] = useState<IDatePicker.Direction>();
  const getDatePickerContainerStyle = useCallback((): CSSProperties | undefined => {
    if (direction === undefined) return undefined;
    if (direction.isFull !== true) {
      const elementClientXY = getElementClientXY(getInputElement());
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

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
      width: `100%`,
      height: `100%`,
      top: 0,
      left: 0,
    };
  }, [applyWidth, direction, getInputElement]);

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
    setResizeOrscrollInfo({ date: new Date() });
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

  const inputOnChangeCallback = useRef((event: Event) => {
    latestTypingDate.current = new Date();
    let value = (event.target as any)?.value;
    if (typeof value !== 'string') { prevValue.current = value; return; }
    if (prevValue.current === value) return;

    if (pickType === 'time') {
      value = `2023-09-09 ` + value;
    }
    const luxonObj = DateTime.fromSQL(value);
    if (luxonObj.isValid) {
      setSelectedDateProxy(luxonObj.toJSDate());
      // if (typeof onSelect === 'function') onSelect(luxonObj.toJSDate(), luxonObj.toFormat(outputFormat));
    } 
    prevValue.current = value;
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
      finallyValue = `${DateTime.fromJSDate(rangeDate.start).toFormat(outputFormat)} ~ ${DateTime.fromJSDate(rangeDate.end).toFormat(outputFormat)}`;
    } else if (rangeDate.start !== undefined && rangeDate.end === undefined) {
      finallyValue = `${DateTime.fromJSDate(rangeDate.start).toFormat(outputFormat)} ~ `;
    } else if (rangeDate.start === undefined && rangeDate.end !== undefined) {
      finallyValue = `~ ${DateTime.fromJSDate(rangeDate.end).toFormat(outputFormat)}`;
    }

    return finallyValue;
  }, [outputFormat]);

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

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

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
      luxonObj = luxonObj.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else if (systemOutputFormat === 'yyyy-MM') {
      luxonObj = luxonObj.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else if (systemOutputFormat === 'yyyy-MM-dd HH') {
      luxonObj = luxonObj.set({ minute: 0, second: 0, millisecond: 0 });
    } else if (systemOutputFormat === 'yyyy-MM-dd HH:mm') {
      luxonObj = luxonObj.set({ second: 0, millisecond: 0 });
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
        startLuxonObj = startLuxonObj.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      } else if (systemOutputFormat === 'yyyy-MM') {
        startLuxonObj = startLuxonObj.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH') {
        startLuxonObj = startLuxonObj.set({ minute: 0, second: 0, millisecond: 0 });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH:mm') {
        startLuxonObj = startLuxonObj.set({ second: 0, millisecond: 0 });
      }
    }

    if (endLuxonObj !== undefined) {
      if (systemOutputFormat === 'yyyy-MM-dd') {
        endLuxonObj = endLuxonObj.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      } else if (systemOutputFormat === 'yyyy-MM') {
        endLuxonObj = endLuxonObj.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH') {
        endLuxonObj = endLuxonObj.set({ minute: 0, second: 0, millisecond: 0 });
      } else if (systemOutputFormat === 'yyyy-MM-dd HH:mm') {
        endLuxonObj = endLuxonObj.set({ second: 0, millisecond: 0 });
      }
    }

    if (typeof setSelectedRangeDate === 'function') setSelectedRangeDate(prev => ({ start: startLuxonObj?.toJSDate(), end: endLuxonObj?.toJSDate() }));
  }

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


    // if (isShow === true) {
    //   const callback = resizeCallback.current;
    //   callback();

    //   if (selectedRangeDate !== undefined) {
    //     setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedRangeDate.start ?? new Date(), { start: selectedRangeDate.start, end: selectedRangeDate.end }));
    //   } else if (selectedDate !== undefined) {
    //     setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedDate, selectedDate));
    //   } else {
    //     setCurrentCalendarInfo(calendar.getDayCalendarInfo(new Date()));
    //   }
    // } else {
    //   if (typeof onValueChange === 'function' && selectedDate !== undefined) onValueChange(DateTime.fromJSDate(selectedDate).toFormat(outputFormat));
    // }
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
    if (isExistPortal === true) {
      const callback = resizeCallback.current;
      callback();
    }
  }, [isExistPortal]);

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
      setCurrentCalendarInfo(calendar.getDayCalendarInfo((selectedRangeDate.start ?? selectedRangeDate.end) ?? new Date(), selectedRangeDate));
      if (typeof onValueChange === 'function' && isApplyValue()) {
        onValueChange(getRangeInputValue(selectedRangeDate));
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
                  target="start"
                  isSelected={rangeDateControlTarget === 'start'}
                  selectedRangeDate={selectedRangeDate}
                  setSelectedRangeDateProxy={setSelectedRangeDateProxy}
                  onClick={() => {
                    setRangeDateControlTarget('start');
                  }}
                  />
                <div style={{ width: '100%', height: '4px' }}></div>
                <RangeItemContainer 
                  pickType={pickType}
                  timeType={timeType}
                  target="end"
                  isSelected={rangeDateControlTarget === 'end'}
                  selectedRangeDate={selectedRangeDate}
                  setSelectedRangeDateProxy={setSelectedRangeDateProxy}
                  onClick={() => {
                    setRangeDateControlTarget('end');
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
                            setSelectedDateProxy(luxonObj.toJSDate());
                            if (typeof onValueChange === 'function') onValueChange(DateTime.fromJSDate(luxonObj.toJSDate()).toFormat(outputFormat));
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
                              if (typeof setIsShow === 'function') setIsShow(prev => false);
                              if (selectedDate === undefined) {
                                setSelectedDateProxy(undefined);  
                              } else {
                                setSelectedDateProxy(DateTime.fromJSDate(item.date).set({ hour: selectedDate?.getHours(), minute: selectedDate?.getMinutes(), second: selectedDate?.getSeconds() }).toJSDate());
                              }
                              if (typeof onValueChange === 'function') onValueChange(DateTime.fromJSDate(item.date).toFormat(outputFormat));
                            }

                            if (rangeType === 'range') {
                              // if (typeof setIsShow === 'function') setIsShow(prev => false);
                              if (selectedRangeDate === undefined) {
                                setSelectedRangeDateProxy(undefined);
                              } else {
                                let newSelectedRangeDate: IDatePicker.RangeDate | undefined;
                                if (rangeDateControlTarget === 'start') {
                                  let start: Date | undefined = undefined;
                                  if (selectedRangeDate.start !== undefined) {
                                    start = DateTime.fromJSDate(selectedRangeDate.start).set({ year: item.dayInfo.year, month: item.dayInfo.month, day: item.dayInfo.day }).toJSDate();
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

function RangeItemContainer(props: IDatePicker.RangeItemContainerProps) {
  const {
    target,
    pickType,
    timeType,
    isSelected,
    onClick,
    selectedRangeDate,
    setSelectedRangeDateProxy,
  } = props;

  // const [dateValue, setDateValue] = useState<string>('');

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
    return luxonObj.toFormat('yyyy-MM-dd');
  }, [selectedRangeDate, selectedDate]);

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
              Array.from<IDatePicker.TimeType>(['hour-minute', 'hour-minute-second']).includes(timeType ?? '') ? '' : styles['hidden'],
            ].join(' ')}>
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
              Array.from<IDatePicker.TimeType>(['hour-minute-second']).includes(timeType ?? '') ? '' : styles['hidden'],
            ].join(' ')}>
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