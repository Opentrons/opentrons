import { i18n } from '../../localization'
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
    name: i18n.t('flex.instrument_selection.name'),
    navPillPage: [1],
  },
  {
    name: i18n.t('flex.modules_selection.name'),
    navPillPage: [2],
  },
]

export const navPillTabListLength = navPillsNameTabList.length - 1

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
  'Opentrons 96 Filter Tip Rack 200 µ',
  'Opentrons 96 Filter Tip Rack 1000 µL',
  'Opentrons 96 Filter Tip Rack 200 µL',
]

export const blockedTipRackListForOt2: string[] = [
  'Opentrons Flex 96 Tip Rack 1000 µL',
  'Opentrons Flex 96 Tip Rack 200 µL',
  'Opentrons Flex 96 Tip Rack 50 µL',
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
  left: string
  right: string
}

export const pipetteSlot: pipetteSlots = {
  left: 'left',
  right: 'right',
}

export const blockMount: string[] = ['p1000_96']

interface selectPage {
  newFlexFileForm: string
  protocolEditor: string
  defaultLandingPage: string
}

export const selectPageForms: selectPage = {
  newFlexFileForm: 'new-flex-file-form',
  protocolEditor: 'protocol-editor',
  defaultLandingPage: 'default-landing-page',
}
