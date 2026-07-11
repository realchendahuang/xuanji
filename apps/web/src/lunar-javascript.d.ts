declare module 'lunar-javascript' {
  type EightChar = {
    getYear: () => string
    getMonth: () => string
    getDay: () => string
    getTime: () => string
  }
  type Lunar = { getEightChar: () => EightChar }
  export const Solar: {
    fromYmdHms: (
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ) => { getLunar: () => Lunar }
  }
}
