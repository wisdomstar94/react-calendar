import { IUseCalendar } from "./use-calendar.interface";
import { DateTime } from 'luxon';

export function useCalendar() {
  function convertWeekDay(weekDay: number) {
    if (weekDay === 7) return 0;
    return weekDay;
  }

  function getDayCalendarInfo(targetDate: Date, selectedDates?: Date[]): IUseCalendar.CalendarInfo {
    const startOfWeekDay = DateTime.fromJSDate(targetDate).startOf('month').get('weekday');
    const startOfWeekDayConvert = convertWeekDay(startOfWeekDay);

    const dayItems: IUseCalendar.DayItem[] = Array.from({ length: 42 });
    const todayYYYYMMDD = DateTime.now().toFormat('yyyy-MM-dd');
    const selectedDatesYYYYMMDDs = selectedDates?.map((x) => DateTime.fromJSDate(x).toFormat('yyyy-MM-dd'));

    let count = 0;
    const startDate = DateTime.fromJSDate(targetDate).startOf('month');
    
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
        isSelected: selectedDatesYYYYMMDDs === undefined || selectedDatesYYYYMMDDs.length === 0 ? false : selectedDatesYYYYMMDDs.includes(luxonDate.toFormat('yyyy-MM-dd')),
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
        isSelected: selectedDatesYYYYMMDDs === undefined || selectedDatesYYYYMMDDs.length === 0 ? false : selectedDatesYYYYMMDDs.includes(luxonDate.toFormat('yyyy-MM-dd')),
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
      prevMonth: DateTime.fromJSDate(targetDate).minus({ month: 1 }).startOf('month').toJSDate(),
      nextMonth: DateTime.fromJSDate(targetDate).plus({ month: 1 }).startOf('month').toJSDate(),
      prevYear: DateTime.fromJSDate(targetDate).minus({ year: 1 }).toJSDate(),
      nextYear: DateTime.fromJSDate(targetDate).plus({ year: 1 }).toJSDate(),
    };
  }

  return {
    getDayCalendarInfo,
  };
}