// @flow
import {getWellTotalVolume} from '@opentrons/shared-data'

/*******************
** Warning Messages **
********************/

export type FormWarning = 'OVER_MAX_WELL_VOLUME'
const FORM_WARNINGS: {[FormWarning]: string} = {
  OVER_MAX_WELL_VOLUME: 'Dispense volume will overflow a destination well'
}
export type warningChecker = (mixed) => ?string

// TODO: test these
/*******************
** Warning Checkers **
********************/

type maxWellVolumeFields = {'dispense--labware'?: ?string, 'dispense--wells'?: ?Array<string>, volume?: ?number}
export const maxWellVolume = (fields: maxWellVolumeFields): ?string => {
  // const labware = fields['dispense--labware']
  // const wells = fields['dispense--wells']
  const {volume} = fields
  if (!wells) return null
  wells.forEach(well => {
    const maximum = getWellTotalVolume(labware, well)
    console.log('warnings', labware, wells, volume, maximum)
    if (maximum && (volume > maximum)) return FORM_WARNINGS.OVER_MAX_WELL_VOLUME
  })
}

/*******************
**     Helpers    **
********************/

export const composeWarnings = (...warningCheckers: Array<warningChecker>) => (formData: mixed): Array<string> => (
  warningCheckers.reduce((acc, checker) => {
    const possibleWarning = checker(formData)
    return possibleWarning ? [...acc, possibleWarning] : acc
  }, [])
)
