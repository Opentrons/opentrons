// images by labware load name

// TODO: BC 2020-04-01): this mapping should live in shared-data,
// it is now following the existing pattern in labware-library
import {
  eppendorf_96_tiprack_10ul_eptips,
  eppendorf_96_tiprack_1000ul_eptips,
  geb_96_tiprack_10ul,
  geb_96_tiprack_1000ul,
  generic_custom_tiprack,
  opentrons_96_tiprack_10ul_side_view,
  opentrons_96_tiprack_300ul_side_view,
  opentrons_96_tiprack_1000ul_side_view,
  opentrons_calibrationblock,
  removable_black_plastic_trash_bin,
  tipone_96_tiprack_200ul,
} from '@opentrons/shared-data'

export const labwareImages = {
  opentrons_96_tiprack_1000ul: opentrons_96_tiprack_1000ul_side_view,
  opentrons_96_filtertiprack_1000ul: opentrons_96_tiprack_1000ul_side_view,
  opentrons_96_tiprack_10ul: opentrons_96_tiprack_10ul_side_view,
  opentrons_96_filtertiprack_10ul: opentrons_96_tiprack_10ul_side_view,
  opentrons_96_tiprack_20ul: opentrons_96_tiprack_10ul_side_view,
  opentrons_96_filtertiprack_20ul: opentrons_96_tiprack_10ul_side_view,
  opentrons_96_tiprack_300ul: opentrons_96_tiprack_300ul_side_view,
  opentrons_96_filtertiprack_200ul: opentrons_96_tiprack_300ul_side_view,
  geb_96_tiprack_1000ul,
  geb_96_tiprack_10ul,
  tipone_96_tiprack_200ul,
  eppendorf_96_tiprack_1000ul_eptips,
  eppendorf_96_tiprack_10ul_eptips,
  opentrons_calibrationblock_short_side_right: opentrons_calibrationblock,
  opentrons_calibrationblock_short_side_left: opentrons_calibrationblock,
  generic_custom_tiprack,
  removable_black_plastic_trash_bin,
}
