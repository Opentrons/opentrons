import round from 'lodash/round'

const PERCENTAGE_DECIMALS_ALLOWED = 1

export const formatPercentage = (part: number, total: number): string =>
  `${round((part / total) * 100, PERCENTAGE_DECIMALS_ALLOWED)}%`
