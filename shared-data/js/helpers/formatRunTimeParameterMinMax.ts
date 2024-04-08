import type { RunTimeParameter } from '../types'

export const formatRunTimeParameterMinMax = (
  runTimeParameter: RunTimeParameter
): string => {
  const min = 'min' in runTimeParameter ? runTimeParameter.min : 0
  const max = 'max' in runTimeParameter ? runTimeParameter.max : 0
  return runTimeParameter.type === 'int'
    ? `${min}-${max}`
    : `${min.toFixed(1)}-${max.toFixed(1)}`
}
