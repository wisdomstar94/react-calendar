import { IUseCalendar } from "./use-calendar.interface";
import { DateTime } from 'luxon';

export function useCalendar() {
  function convertWeekDay(weekDay: number) {
    if (weekDay === 7) return 0;
    return weekDay;
  }

  function getDayCalendarInfo(targetDate: Date, selectedDate?: IUseCalendar.SelectedDate): IUseCalendar.CalendarInfo {
    const startOfWeekDay = DateTime.fromJSDate(targetDate).startOf('month').get('weekday');
    const startOfWeekDayConvert = convertWeekDay(startOfWeekDay);

    const dayItems: IUseCalendar.DayItem[] = Array.from({ length: 42 });
    const todayYYYYMMDD = DateTime.now().toFormat('yyyy-MM-dd');
    // const selectedDatesYYYYMMDDs = selectedDates?.map((x) => DateTime.fromJSDate(x).toFormat('yyyy-MM-dd'));

    let count = 0;
    const startDate = DateTime.fromJSDate(targetDate).startOf('month');
    
    const isSelected = (luxonDate: DateTime) => {
      if (selectedDate === undefined) return false;
      if (selectedDate instanceof Date) {
        return luxonDate.toFormat('yyyy-MM-dd') === DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd');
      } else {
        const startDate = selectedDate.start;
        const endDate = selectedDate.end;
        if (startDate !== undefined && endDate === undefined) {
          return luxonDate.toFormat('yyyy-MM-dd') === DateTime.fromJSDate(startDate).toFormat('yyyy-MM-dd');
        } else if (startDate === undefined && endDate !== undefined) {
          return luxonDate.toFormat('yyyy-MM-dd') === DateTime.fromJSDate(endDate).toFormat('yyyy-MM-dd');
        } else if (startDate !== undefined && endDate !== undefined) {
          const startDateLuxonObj = DateTime.fromJSDate(startDate).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
          const endDateLuxonObj = DateTime.fromJSDate(endDate).set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
          return (luxonDate.toJSDate().getTime() >= startDateLuxonObj.toJSDate().getTime() && luxonDate.toJSDate().getTime() <= endDateLuxonObj.toJSDate().getTime());
        }
      }
      return false;
    };

    count = 1;
    for (let i = startOfWeekDayConvert - 1; i >= 0; i--) {
      const luxonDate = startDate.minus({ day: count });
      dayItems[i] = {
        date: luxonDate.toJSDate(),
        dayInfo: {
          year: luxonDate.get('year'),
          month: luxonDate.get('month'),
          day: luxonDate.get('day'),
          weekDay: luxonDate.get('weekday'),
          weekdayShort: luxonDate.get('weekdayShort').toString(),
          weekdayLong: luxonDate.get('weekdayLong').toString(),
        },
        isToday: todayYYYYMMDD === luxonDate.toFormat('yyyy-MM-dd'),
        isSelected: isSelected(luxonDate),
        isWeekend: [6, 7].includes(luxonDate.get('weekday')),
        yyyymmdd: luxonDate.toFormat('yyyy-MM-dd'),
        isIncludeCurrentMonth: luxonDate.toFormat('yyyy-MM') === DateTime.fromJSDate(targetDate).toFormat('yyyy-MM'),
        isSat: luxonDate.get('weekday') === 6,
        isSun: luxonDate.get('weekday') === 7,
      };
      count++;
    }
    
    count = 0;
    for (let i = startOfWeekDayConvert; i < 42; i++) {
      const luxonDate = startDate.plus({ day: count });
      dayItems[i] = {
        date: luxonDate.toJSDate(),
        dayInfo: {
          year: luxonDate.get('year'),
          month: luxonDate.get('month'),
          day: luxonDate.get('day'),
          weekDay: luxonDate.get('weekday'),
          weekdayShort: luxonDate.get('weekdayShort').toString(),
          weekdayLong: luxonDate.get('weekdayLong').toString(),
        },
        isToday: todayYYYYMMDD === luxonDate.toFormat('yyyy-MM-dd'),
        isSelected: isSelected(luxonDate),
        isWeekend: [6, 7].includes(luxonDate.get('weekday')),
        yyyymmdd: luxonDate.toFormat('yyyy-MM-dd'),
        isIncludeCurrentMonth: luxonDate.toFormat('yyyy-MM') === DateTime.fromJSDate(targetDate).toFormat('yyyy-MM'),
        isSat: luxonDate.get('weekday') === 6,
        isSun: luxonDate.get('weekday') === 7,
      };
      count++;
    }

    return {
      dayItems,
      prevMonthDate: DateTime.fromJSDate(targetDate).minus({ month: 1 }).startOf('month').toJSDate(),
      nextMonthDate: DateTime.fromJSDate(targetDate).plus({ month: 1 }).startOf('month').toJSDate(),
      prevYearDate: DateTime.fromJSDate(targetDate).minus({ year: 1 }).toJSDate(),
      nextYearDate: DateTime.fromJSDate(targetDate).plus({ year: 1 }).toJSDate(),
      currentMonth: targetDate.getMonth() + 1,
      currentYear: targetDate.getFullYear(),
      currentDate: targetDate,
    };
  }

  return {
    getDayCalendarInfo,
  };
}