export function getCurrentNetherlandsTime(): Date {
  const netherlandsTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })
  return new Date(netherlandsTime)
}

export function calculateTimeDifference(targetSeconds: number, currentNetherlandsDate: Date): number {
  const currentNetherlandsSeconds = currentNetherlandsDate.getHours() * 3600 + 
                                   currentNetherlandsDate.getMinutes() * 60 + 
                                   currentNetherlandsDate.getSeconds()
  return targetSeconds - currentNetherlandsSeconds
}

export function adjustForYesterday(timeDifference: number, autoYesterday: boolean): number {
  if (autoYesterday && timeDifference > 0) {
    return timeDifference - 24 * 3600
  }
  return timeDifference
}