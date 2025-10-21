interface TimeData {
  minutes: string
  seconds: string
}
export const getTimeFromString = (timeString: string): TimeData => {
  const [minutes, seconds] = timeString.split(':')
  return { minutes, seconds }
}

export const getStepIndex = (orderedSteps: any[], stepId: string): number => {
  return (
    orderedSteps.reduce((acc, step, i) => {
      if (step.id === stepId) {
        return i
      }
      return acc
    }, orderedSteps.length) + 1
  ) // handle if step is being added, not edited
}
