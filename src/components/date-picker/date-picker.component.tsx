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
    pickTypes,
    
    selectedDate,
    setSelectedDate,

    isShow,
    setIsShow,

    onValueChange,
    width,
  } = props;
  const isTimeAllowSecondPick = useMemo(() => props.isTimeAllowSecondPick ?? false, [props.isTimeAllowSecondPick]);
  const outputFormat = useMemo(() => {
    if (typeof props.outputFormat === 'string') {
      return props.outputFormat;
    }

    const sets = new Set(pickTypes);
    if (sets.size === 2 && sets.has('date') && sets.has('time')) {
      if (isTimeAllowSecondPick) {
        return `yyyy-MM-dd HH:mm:ss`;
      } else {
        return `yyyy-MM-dd HH:mm`;
      }
    } else if (sets.size === 1 && sets.has('time')) {
      return `HH:mm`;
    } else if (sets.size === 1 && sets.has('date')) {
      return `yyyy-MM-dd`;
    }

    return `yyyy-MM-dd`;
  }, [isTimeAllowSecondPick, pickTypes, props.outputFormat]);

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
    // console.log('@event', event);
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
    // console.log('@inputOnChangeCallback', event);
    const value = (event.target as any)?.value;
    if (typeof value !== 'string') { prevValue.current = value; return; }
    if (value.length < 10) { prevValue.current = value; return; }
    // console.log('@value', value);

    if (prevValue.current === value) return;

    const luxonObj = DateTime.fromSQL(value);
    if (luxonObj.isValid) {
      if (typeof setSelectedDate === 'function') setSelectedDate(luxonObj.toJSDate());
      // if (typeof onSelect === 'function') onSelect(luxonObj.toJSDate(), luxonObj.toFormat(outputFormat));
    } 
    prevValue.current = value;
  });

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
    if (isShow === true) {
      const callback = resizeCallback.current;
      callback();

      if (selectedDate !== undefined) {
        setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedDate, [selectedDate]));
      }
    } else {
      if (typeof onValueChange === 'function' && selectedDate !== undefined) onValueChange(DateTime.fromJSDate(selectedDate).toFormat(outputFormat));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShow]);

  useEffect(() => {
    const callback = inputFocusCallback.current;

    const inputElement = getInputElement();
    inputElement?.removeEventListener('focus', callback);
    inputElement?.addEventListener('focus', callback);
    if (inputElement !== null) {
      inputElement.maxLength = 19;
    }

    return () => {
      inputElement?.removeEventListener('focus', callback);
    };
  }, [getInputElement]);

  useEffect(() => {
    const callback = inputOnChangeCallback.current;

    const inputElement = getInputElement();
    inputElement?.removeEventListener('keyup', callback);
    inputElement?.addEventListener('keyup', callback);

    // console.log('@@.inputElement', inputElement);

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
    const isApplyValue = () => {
      if (latestTypingDate.current !== undefined) {
        if (Date.now() - latestTypingDate.current.getTime() <= 150) {
          return false;
        }
      }
      return true;
    };
    
    // console.log('@@@selectedDate', selectedDate);
    if (selectedDate === undefined) {
      setCurrentCalendarInfo(calendar.getDayCalendarInfo(new Date()));
      if (typeof onValueChange === 'function' && isApplyValue()) onValueChange('');
    } else {
      setCurrentCalendarInfo(calendar.getDayCalendarInfo(selectedDate, [selectedDate]));
      if (typeof onValueChange === 'function' && isApplyValue()) onValueChange(DateTime.fromJSDate(selectedDate).toFormat(outputFormat));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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
              ref={datePickerRef}
              className={[
                styles['date-picker'],
              ].join(' ')}>
              <div 
                className={[
                  styles['year-month-dates-area'],
                  pickTypes.includes('date') ? styles['show'] : '',
                ].join(' ')}>
                <div className={styles['top-row']}>
                  <div className={styles['move-to-month-button-icon-button']}
                    onClick={() => {
                      if (currentCalendarInfo?.prevMonthDate !== undefined) {
                        setCurrentCalendarInfo(calendar.getDayCalendarInfo(currentCalendarInfo?.prevMonthDate))
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
                        setCurrentCalendarInfo(calendar.getDayCalendarInfo(currentCalendarInfo?.nextMonthDate))
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
                            item.isSelected ? styles['selected'] : '',
                            !item.isIncludeCurrentMonth ? styles['prev-or-next-month-date'] : '',
                          ].join(' ')}
                          onClick={() => {
                            if (typeof setIsShow === 'function') setIsShow(prev => false);
                            if (typeof setSelectedDate === 'function') {
                              setSelectedDate(prev => {
                                if (prev === undefined) return undefined;
                                const luxonObj = DateTime.fromJSDate(item.date);
                                return luxonObj.set({ hour: prev.getHours(), minute: prev.getMinutes(), second: prev.getSeconds() }).toJSDate();
                              });
                            }
                            if (typeof onValueChange === 'function') onValueChange(DateTime.fromJSDate(item.date).toFormat(outputFormat));
                          }}>
                          { item.dayInfo.day }
                          {
                            item.isToday ? 
                            <>
                              <span className={styles['today-symbol']}></span>
                            </>
                            : null
                          }
                        </div>
                      );
                    })
                  }
                </div>
              </div>
              <div 
                className={[
                  styles['times-area'],
                  pickTypes.includes('time') ? styles['show'] : '',
                ].join(' ')}>
                <div className={styles['time-block']}>
                  <select 
                    className={styles['select-box']} 
                    value={selectedDate?.getHours().toString().padStart(2, '0')}
                    onChange={(event) => {
                      const _value = event.target.value;
                      setSelectedDate(prev => {
                        if (prev === undefined) return undefined;
                        const luxonObj = DateTime.fromJSDate(prev).set({ hour: Number(_value) });
                        return luxonObj.toJSDate();
                      });
                    }}
                    >
                    {
                      Array.from({ length: 24 }).map((item, index) => {
                        return (
                          <option
                            key={index}>
                            { index.toString().padStart(2, '0') }
                          </option>
                        );
                      })
                    }
                  </select>
                  <span>시</span>
                </div>  
                <div className={styles['time-block']}>
                  <select 
                    className={styles['select-box']} 
                    value={selectedDate?.getMinutes().toString().padStart(2, '0')}
                    onChange={(event) => {
                      const _value = event.target.value;
                      setSelectedDate(prev => {
                        if (prev === undefined) return undefined;
                        const luxonObj = DateTime.fromJSDate(prev).set({ minute: Number(_value) });
                        return luxonObj.toJSDate();
                      });
                    }}
                    >
                    {
                      Array.from({ length: 60 }).map((item, index) => {
                        return (
                          <option
                            key={index}>
                            { index.toString().padStart(2, '0') }
                          </option>
                        );
                      })
                    }
                  </select>
                  <span>분</span>
                </div>
                <div 
                  className={[
                    styles['time-block'],
                    !isTimeAllowSecondPick ? styles['hidden'] : '',
                  ].join(' ')}>
                  <select 
                    className={styles['select-box']} 
                    value={selectedDate?.getSeconds().toString().padStart(2, '0')}
                    onChange={(event) => {
                      const _value = event.target.value;
                      setSelectedDate(prev => {
                        if (prev === undefined) return undefined;
                        const luxonObj = DateTime.fromJSDate(prev).set({ second: Number(_value) });
                        return luxonObj.toJSDate();
                      });
                    }}
                    >
                    {
                      Array.from({ length: 60 }).map((item, index) => {
                        return (
                          <option
                            key={index}>
                            { index.toString().padStart(2, '0') }
                          </option>
                        );
                      })
                    }
                  </select>
                  <span>초</span>
                </div>
              </div>
            </div>
          </div>
        </Portal>
        : null
      }      
      <div className=" grid-col"></div>
    </>
  );
}

function Portal(props: { children: ReactNode, selector: string }) {
  const { children, selector } = props;
  const element = typeof window !== "undefined" && document.querySelector(selector);
  return element && children ? createPortal(children, element) : null;
};