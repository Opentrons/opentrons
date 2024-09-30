import round from 'lodash/round'
import omitBy from 'lodash/omitBy'
import type { WellIngredientVolumeData } from '../../../../steplist'

export const capitalizeFirstLetterAfterNumber = (title: string): string =>
  title.replace(
    /(^[\d\W]*)([a-zA-Z])/,
    (match, prefix, firstLetter) => `${prefix}${firstLetter.toUpperCase()}`
  )

const VOLUME_SIG_DIGITS_DEFAULT = 2
export function formatVolume(
  inputVolume?: string | number | null,
  sigDigits: number = VOLUME_SIG_DIGITS_DEFAULT
): string {
  if (typeof inputVolume === 'number') {
    // don't add digits to numbers with nothing to the right of the decimal
    const digits = inputVolume.toString().split('.')[1] ? sigDigits : 0
    return String(round(inputVolume, digits))
  }

  return inputVolume || ''
}
const PERCENTAGE_DECIMALS_ALLOWED = 1
export const formatPercentage = (part: number, total: number): string => {
  return `${round((part / total) * 100, PERCENTAGE_DECIMALS_ALLOWED)}%`
}

export const compactPreIngreds = (
  preIngreds: WellIngredientVolumeData
): Partial<
  | {
      [ingredId: string]:
        | {
            volume: number
          }
        | undefined
    }
  | {
      [well: string]:
        | {
            [ingredId: string]: {
              volume: number
            }
          }
        | undefined
    }
> => {
  return omitBy(preIngreds, ingred => {
    return typeof ingred?.volume === 'number' && ingred.volume <= 0
  })
}
