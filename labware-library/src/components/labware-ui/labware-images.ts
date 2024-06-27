// images by labware load name
// TODO(mc, 2019-05-29): shared-data? components-library?

export const labwareImages: Record<string, string[]> = {
  agilent_1_reservoir_290ml: [
    new URL(
      '../../images/agilent_1_reservoir_290ml_side_view.jpg',
      import.meta.url
    ).href,
  ],
  axygen_1_reservoir_90ml: [
    new URL(
      '../../images/axygen_1_reservoir_90ml_side_view.jpg',
      import.meta.url
    ).href,
  ],
  biorad_96_wellplate_200ul_pcr: [
    new URL(
      '../../images/biorad_96_wellplate_200ul_pcr_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  'corning_12_wellplate_6.9ml_flat': [
    new URL(
      '../../images/corning_12_wellplate_6.9ml_flat_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  'corning_24_wellplate_3.4ml_flat': [
    new URL(
      '../../images/corning_24_wellplate_3.4ml_flat_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  corning_384_wellplate_112ul_flat: [
    new URL(
      '../../images/corning_384_wellplate_112ul_flat_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  corning_96_wellplate_360ul_flat: [
    new URL(
      '../../images/corning_96_wellplate_360ul_flat_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  'corning_48_wellplate_1.6ml_flat': [
    new URL(
      '../../images/corning_48_wellplate_1.6ml_flat_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  'corning_6_wellplate_16.8ml_flat': [
    new URL(
      '../../images/corning_6_wellplate_16.8ml_flat_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  eppendorf_96_tiprack_1000ul_eptips: [
    new URL(
      '../../images/eppendorf_1000ul_tip_eptips_side_view.jpg',
      import.meta.url
    ).href,
  ],
  eppendorf_96_tiprack_10ul_eptips: [
    new URL(
      '../../images/eppendorf_10ul_tips_eptips_side_view.jpg',
      import.meta.url
    ).href,
  ],
  geb_96_tiprack_1000ul: [
    new URL('../../images/geb_96_tiprack_1000ul_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/geb_1000ul_tip_side_view.jpg', import.meta.url).href,
  ],
  geb_96_tiprack_10ul: [
    new URL('../../images/geb_96_tiprack_10ul_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/geb_10ul_tip_side_view.jpg', import.meta.url).href,
  ],
  nest_1_reservoir_195ml: [
    new URL(
      '../../images/nest_1_reservoir_195ml_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  nest_1_reservoir_290ml: [
    new URL('../../images/nest_1_reservoir_290ml.jpg', import.meta.url).href,
  ],
  nest_12_reservoir_15ml: [
    new URL(
      '../../images/nest_12_reservoir_15ml_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  nest_96_wellplate_100ul_pcr_full_skirt: [
    new URL(
      '../../images/nest_96_wellplate_100ul_pcr_full_skirt_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  nest_96_wellplate_200ul_flat: [
    new URL(
      '../../images/nest_96_wellplate_200ul_flat_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  nest_96_wellplate_2ml_deep: [
    new URL('../../images/nest_96_wellplate_2ml_deep.jpg', import.meta.url)
      .href,
  ],
  opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical: [
    new URL(
      '../../images/opentrons_10_tuberack_4_6_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/falcon_50ml_15ml_conical_tubes.jpg', import.meta.url)
      .href,
  ],
  opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic: [
    new URL('../../images/falcon_50ml_15ml_conical_tubes.jpg', import.meta.url)
      .href,
  ],
  opentrons_15_tuberack_falcon_15ml_conical: [
    new URL('../../images/opentrons_15_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/falcon_15ml_conical_tube.jpg', import.meta.url).href,
  ],
  opentrons_10_tuberack_nest_4x50ml_6x15ml_conical: [
    new URL(
      '../../images/opentrons_10_tuberack_4_6_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/nest_50ml_15ml_conical_tubes.jpg', import.meta.url)
      .href,
  ],
  opentrons_15_tuberack_nest_15ml_conical: [
    new URL('../../images/opentrons_15_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/nest_15ml_conical_tube.jpg', import.meta.url).href,
  ],
  opentrons_6_tuberack_nest_50ml_conical: [
    new URL('../../images/opentrons_6_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/nest_50ml_conical_tube.jpg', import.meta.url).href,
  ],
  opentrons_1_trash_1100ml_fixed: [],
  opentrons_1_trash_850ml_fixed: [],
  opentrons_24_aluminumblock_generic_2ml_screwcap: [
    new URL(
      '../../images/opentrons_24_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/generic_2ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  'opentrons_24_aluminumblock_nest_0.5ml_screwcap': [
    new URL(
      '../../images/opentrons_24_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/nest_0.5ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  'opentrons_24_aluminumblock_nest_1.5ml_screwcap': [
    new URL(
      '../../images/opentrons_24_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/nest_1.5ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  'opentrons_24_aluminumblock_nest_1.5ml_snapcap': [
    new URL(
      '../../images/opentrons_24_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/nest_1.5ml_snapcap_tube.jpg', import.meta.url).href,
  ],
  opentrons_24_aluminumblock_nest_2ml_screwcap: [
    new URL(
      '../../images/opentrons_24_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/nest_2ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  opentrons_24_aluminumblock_nest_2ml_snapcap: [
    new URL(
      '../../images/opentrons_24_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/nest_2ml_snapcap_tube.jpg', import.meta.url).href,
  ],
  'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap': [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL(
      '../../images/eppendorf_1.5ml_safelock_snapcap_tube.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap: [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL(
      '../../images/eppendorf_2ml_safelock_snapcap_tube.jpg',
      import.meta.url
    ).href,
  ],
  'opentrons_24_tuberack_nest_0.5ml_screwcap': [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/nest_0.5ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  'opentrons_24_tuberack_nest_1.5ml_screwcap': [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/nest_1.5ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  'opentrons_24_tuberack_nest_1.5ml_snapcap': [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/nest_1.5ml_snapcap_tube.jpg', import.meta.url).href,
  ],
  opentrons_24_tuberack_nest_2ml_screwcap: [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/nest_2ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  opentrons_24_tuberack_nest_2ml_snapcap: [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/nest_2ml_snapcap_tube.jpg', import.meta.url).href,
  ],
  opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic: [
    new URL(
      '../../images/eppendorf_2ml_safelock_snapcap_tube.jpg',
      import.meta.url
    ).href,
  ],
  'opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic': [],
  opentrons_24_tuberack_generic_2ml_screwcap: [
    new URL('../../images/opentrons_24_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/generic_2ml_screwcap_tube.jpg', import.meta.url).href,
  ],
  'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip': [
    new URL(
      '../../images/eppendorf_2ml_safelock_snapcap_tube.jpg',
      import.meta.url
    ).href,
    new URL('../../images/generic_pcr_strip_200ul_tubes.jpg', import.meta.url)
      .href,
  ],
  opentrons_6_tuberack_falcon_50ml_conical: [
    new URL('../../images/opentrons_6_tuberack_side_view.jpg', import.meta.url)
      .href,
    new URL('../../images/falcon_50ml_conical_tube.jpg', import.meta.url).href,
  ],
  opentrons_96_aluminumblock_biorad_wellplate_200ul: [
    new URL(
      '../../images/opentrons_96_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL(
      '../../images/biorad_96_wellplate_200ul_pcr_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_aluminumblock_generic_pcr_strip_200ul: [
    new URL(
      '../../images/opentrons_96_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/generic_pcr_strip_200ul_tubes.jpg', import.meta.url)
      .href,
  ],
  opentrons_96_aluminumblock_nest_wellplate_100ul: [
    new URL(
      '../../images/opentrons_96_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
    new URL(
      '../../images/nest_96_wellplate_100ul_pcr_full_skirt_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_tiprack_1000ul: [
    new URL(
      '../../images/opentrons_96_tiprack_1000ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_tiprack_10ul: [
    new URL(
      '../../images/opentrons_96_tiprack_10ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_tiprack_20ul: [
    new URL(
      '../../images/opentrons_96_tiprack_10ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_tiprack_300ul: [
    new URL(
      '../../images/opentrons_96_tiprack_300ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_filtertiprack_1000ul: [
    new URL(
      '../../images/opentrons_96_tiprack_1000ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_filtertiprack_10ul: [
    new URL(
      '../../images/opentrons_96_tiprack_10ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_filtertiprack_20ul: [
    new URL(
      '../../images/opentrons_96_tiprack_10ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_filtertiprack_200ul: [
    new URL(
      '../../images/opentrons_96_tiprack_300ul_side_view.jpg',
      import.meta.url
    ).href,
  ],
  tipone_96_tiprack_200ul: [
    new URL(
      '../../images/tipone_96_tiprack_200ul_side_view.jpg',
      import.meta.url
    ).href,
    new URL('../../images/tipone_200ul_tip_side_view.jpg', import.meta.url)
      .href,
  ],
  usascientific_12_reservoir_22ml: [
    new URL(
      '../../images/usascientific_12_reservoir_22ml_side_view.jpg',
      import.meta.url
    ).href,
  ],
  'usascientific_96_wellplate_2.4ml_deep': [
    new URL(
      '../../images/usascientific_96_wellplate_2.4ml_deep_side_view.jpg',
      import.meta.url
    ).href,
  ],
  thermoscientificnunc_96_wellplate_1300ul: [
    new URL(
      '../../images/thermoscientificnunc_96_wellplate_1300ul.jpg',
      import.meta.url
    ).href,
  ],
  thermoscientificnunc_96_wellplate_2000ul: [
    new URL(
      '../../images/thermoscientificnunc_96_wellplate_2000ul.jpg',
      import.meta.url
    ).href,
  ],
  appliedbiosystemsmicroamp_384_wellplate_40ul: [
    new URL(
      '../../images/appliedbiosystemsmicroamp_384_wellplate_40ul.jpg',
      import.meta.url
    ).href,
  ],
  biorad_384_wellplate_50ul: [
    new URL('../../images/biorad_384_wellplate_50ul.jpg', import.meta.url).href,
  ],
  opentrons_96_deep_well_adapter: [
    new URL('../../images/deep_well_plate_adapter.jpg', import.meta.url).href,
  ],
  opentrons_96_flat_bottom_adapter: [
    new URL('../../images/flat_bottom_plate_adapter.jpg', import.meta.url).href,
  ],
  opentrons_96_pcr_adapter: [
    new URL('../../images/pcr_plate_adapter.jpg', import.meta.url).href,
  ],
  opentrons_universal_flat_adapter: [
    new URL('../../images/universal_flat_adapter.jpg', import.meta.url).href,
  ],
  opentrons_aluminum_flat_bottom_plate: [
    new URL('../../images/flat_bottom_aluminum.png', import.meta.url).href,
  ],
  opentrons_96_well_aluminum_block: [
    new URL(
      '../../images/opentrons_96_aluminumblock_side_view.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep: [
    new URL('../../images/deep_well_plate_adapter.jpg', import.meta.url).href,
    new URL('../../images/nest_96_wellplate_2ml_deep.jpg', import.meta.url)
      .href,
  ],
  opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat: [
    new URL('../../images/flat_bottom_plate_adapter.jpg', import.meta.url).href,
    new URL(
      '../../images/nest_96_wellplate_200ul_flat_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt: [
    new URL('../../images/pcr_plate_adapter.jpg', import.meta.url).href,
    new URL(
      '../../images/nest_96_wellplate_100ul_pcr_full_skirt_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat: [
    new URL('../../images/universal_flat_adapter.jpg', import.meta.url).href,
    new URL(
      '../../images/corning_384_wellplate_112ul_flat_photo_three_quarters.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_flex_96_tiprack_adapter: [
    new URL(
      '../../images/opentrons_flex_96_tiprack_adapter.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_flex_96_tiprack_50ul: [
    new URL('../../images/opentrons_flex_96_tiprack_50ul.jpg', import.meta.url)
      .href,
  ],
  opentrons_flex_96_tiprack_200ul: [
    new URL('../../images/opentrons_flex_96_tiprack_200ul.jpg', import.meta.url)
      .href,
  ],
  opentrons_flex_96_tiprack_1000ul: [
    new URL(
      '../../images/opentrons_flex_96_tiprack_1000ul.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_flex_96_filtertiprack_50ul: [
    new URL(
      '../../images/opentrons_flex_96_filtertiprack_50ul.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_flex_96_filtertiprack_200ul: [
    new URL(
      '../../images/opentrons_flex_96_filtertiprack_200ul.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_flex_96_filtertiprack_1000ul: [
    new URL(
      '../../images/opentrons_flex_96_filtertiprack_1000ul.jpg',
      import.meta.url
    ).href,
  ],
  opentrons_96_wellplate_200ul_pcr_full_skirt: [
    new URL(
      '../../images/opentrons_96_wellplate_200ul_pcr_full_skirt.jpg',
      import.meta.url
    ).href,
  ],
}
