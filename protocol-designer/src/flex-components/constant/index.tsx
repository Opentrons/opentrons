import { i18n } from '../../localization'

export * from './colors'
export * from './typography'

interface NavPillTab {
  name: string
  navPillPage: number[]
}

export const navPillsNameTabList: NavPillTab[] = [
  {
    name: i18n.t('flex.name_and_description.name'),
    navPillPage: [0],
  },
  {
    name: i18n.t('flex.pipettes_selection.name'),
    navPillPage: [1, 2],
  },
  {
    name: i18n.t('flex.modules_selection.name'),
    navPillPage: [3],
  },
]

export const navPillTabListLength = navPillsNameTabList.length

// Unsupported tiprack list for the flex robot
export const blockedTipRackListForFlex: string[] = [
  '(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 1000 µL',
  '(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 10 µL',
  '(Retired) GEB 96 Tip Rack 1000 µL',
  '(Retired) GEB 96 Tip Rack 10 µL',
  'Opentrons 96 Filter Tip Rack 10 µL',
  'Opentrons 96 Filter Tip Rack 20 µL',
  'Opentrons 96 Tip Rack 1000 µL',
  'Opentrons 96 Tip Rack 10 µL',
  'Opentrons 96 Tip Rack 20 µL',
  'Opentrons 96 Tip Rack 300 µL',
  '(Retired) TipOne 96 Tip Rack 200 µL',
]

// Custom tiprack option object
export const customTiprackOption: {
  name: string
  value: string
  namespace: string
} = {
  name: 'Custom Tiprack',
  value: 'custom_tiprack',
  namespace: 'custom_tiprack',
}

// constant LEFT/RIGHT Mount Side
export const mountSide: any = [
  {
    name: 'Left Mount',
    value: 'left',
  },
  {
    name: 'Right Mount',
    value: 'right',
  },
]

export const pipetteNameBlocklist: string[] = [
  'p10_single',
  'p10_multi',
  'p50_single',
  'p50_multi',
  'p300_single',
  'p300_multi',
  'p1000_single',
]

interface pipetteSlots {
  firstPipette: string
  secondPipette: string
}

export const pipetteSlot: pipetteSlots = {
  firstPipette: 'firstPipette',
  secondPipette: 'secondPipette',
}

export const blockMount: string[] = ['p1000_96']
