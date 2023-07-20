export declare namespace IUseCalendar {
  export interface DayInfo {
    /** 년도 */
    year: number;
    /** 월 (1월이 1부터 시작함) */
    month: number;
    /** 일 */
    day: number;
    /** 
     * 요일 
     * - 1 : 월요일
     * - 2 : 화요일 
     * - 3 : 수요일 
     * - 4 : 목요일 
     * - 5 : 금요일 
     * - 6 : 토요일 
     * - 7 : 일요일 
     */
    weekDay: number;
    weekdayShort: string;
    weekdayLong: string;
  }

  export interface DayItem {
    /** 해당 날짜에 해당하는 date 값. 시분초는 모두 0으로 설정되어 있음 */
    date: Date;
    /** day 에 대한 간략한 정보 */
    dayInfo: DayInfo; 
    /** ex) 2023-04-29 */
    yyyymmdd: string;
    /** 오늘인지 아닌지 여부 */
    isToday: boolean;
    /** 현재 선택되어 있는 날짜인지 아닌지 여부 */
    isSelected: boolean;
    /** 주말인지 아닌지 여부 */
    isWeekend: boolean;
    /** 토요일인지 여부 */
    isSat: boolean;
    /** 일요일인지 여부 */
    isSun: boolean;
    /** 현재 포커싱된 달에 속한 날짜인지 아닌지 여부 */
    isIncludeCurrentMonth: boolean;
  }

  export interface CalendarInfo {
    dayItems: DayItem[];
    prevMonth: Date;
    nextMonth: Date;
    prevYear: Date;
    nextYear: Date;
  }
}