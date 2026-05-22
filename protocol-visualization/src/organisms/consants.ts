// note: dropTip is not included since it can happen in a tiprack for return tip
// instead, the trash/waste chute is highlighted via looking at the pipette.entityId
//  state
export const POTENTIAL_TRASH_COMMAND_TYPES = [
  'moveToAddressableArea',
  'moveToAddressableAreaForDropTip',
  'dropTipInPlace',
  'airGapInPlace',
  'blowOutInPlace',
  'blowOut',
  'airGap',
]
