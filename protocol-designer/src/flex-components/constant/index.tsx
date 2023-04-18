import { i18n } from "../../localization";

export * from './colors'
export * from './typography'

export const navPillsNameTabList = [
    {
        name: i18n.t('flex.name_and_description.name'),
        id: 1,
    },
    {
        name: `First ${i18n.t('flex.pipettes_selection.name')}`,
        id: 2,
    },
    {
        name: `Second ${i18n.t('flex.pipettes_selection.name')}`,
        id: 3,
    },
    {
        name: i18n.t('flex.modules_selection.name'),
        id: 4,
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
];

// Custom tiprack option object
export const customTiprackOption: { name: string, value: string } = { name: "Custom Tiprack", value: "custome_tiprack" };

// constant LEFT/RIGHT Mount Side
export const mountSide: any = [{
    name: "Left Mount",
    value: "left"
},
{
    name: "Right Mount",
    value: "right",
}]

