import {
  flex40,
  green40,
  purple40,
  yellow40,
} from '../../../helix-design-system/colors'

export const getTiprackBackgroundColor = (loadName: string): string => {
  let tiprackColor = '#CCCCCC'
  if (
    loadName === 'opentrons_flex_96_tiprack_50ul' ||
    loadName === 'opentrons_flex_96_filtertiprack_50ul'
  ) {
    tiprackColor = purple40
  } else if (
    loadName === 'opentrons_flex_96_tiprack_1000ul' ||
    loadName === 'opentrons_flex_96_filtertiprack_1000ul'
  ) {
    tiprackColor = flex40
  } else if (
    loadName === 'opentrons_flex_96_tiprack_200ul' ||
    loadName === 'opentrons_flex_96_filtertiprack_200ul'
  ) {
    tiprackColor = yellow40
  } else if (
    loadName === 'opentrons_flex_96_tiprack_20ul' ||
    loadName === 'opentrons_flex_96_filtertiprack_20ul'
  ) {
    tiprackColor = green40
  }
  return tiprackColor
}
