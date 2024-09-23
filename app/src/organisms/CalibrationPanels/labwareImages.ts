// images by labware load name

// TODO: BC 2020-04-01): this mapping should live in shared-data,
// it is now following the existing pattern in labware-library
import opentrons_96_tiprack_1000ul_side_view from '/app/assets/images/labware/opentrons_96_tiprack_1000ul_side_view.jpg'
import opentrons_96_tiprack_10ul_side_view from '/app/assets/images/labware/opentrons_96_tiprack_10ul_side_view.jpg'
import opentrons_96_tiprack_300ul_side_view from '/app/assets/images/labware/opentrons_96_tiprack_300ul_side_view.jpg'
import geb_96_tiprack_1000ul from '/app/assets/images/labware/geb_96_tiprack_1000ul_side_view.jpg'
import geb_96_tiprack_10ul from '/app/assets/images/labware/geb_96_tiprack_10ul_side_view.jpg'
import tipone_96_tiprack_200ul from '/app/assets/images/labware/tipone_96_tiprack_200ul_side_view.jpg'
import eppendorf_96_tiprack_1000ul_eptips from '/app/assets/images/labware/eppendorf_1000ul_tip_eptips_side_view.jpg'
import eppendorf_96_tiprack_10ul_eptips from '/app/assets/images/labware/eppendorf_10ul_tips_eptips_side_view.jpg'
import opentrons_calibrationblock from '/app/assets/images/labware/opentrons_calibration_block.png'
import generic_custom_tiprack from '/app/assets/images/labware/generic_tiprack_side_view.png'
import removable_black_plastic_trash_bin from '/app/assets/images/labware/removable_black_plastic_trash_bin.png'

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
