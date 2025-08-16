export function getCurrentNetherlandsTime(): Date {
  const netherlandsTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })
  return new Date(netherlandsTime)
}

export function calculateTimeDifference(targetSeconds: number, currentNetherlandsDate: Date): number {
  const currentNetherlandsSeconds = currentNetherlandsDate.getHours() * 3600 + 
                                   currentNetherlandsDate.getMinutes() * 60 + 
                                   currentNetherlandsDate.getSeconds()
  
  // Calculate both directions
  const forwardDiff = targetSeconds - currentNetherlandsSeconds
  const backwardDiff = forwardDiff + (forwardDiff < 0 ? 24 * 3600 : -24 * 3600)
  
  // Choose the shortest time difference
  return Math.abs(forwardDiff) <= Math.abs(backwardDiff) ? forwardDiff : backwardDiff
}

export function adjustForYesterday(timeDifference: number, autoYesterday: boolean): number {
  if (autoYesterday && timeDifference > 0) {
    return timeDifference - 24 * 3600
  }
  return timeDifference
}