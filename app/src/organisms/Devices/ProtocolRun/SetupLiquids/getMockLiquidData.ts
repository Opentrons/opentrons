// this file will be replaced once we are able to pull real data from protocol analysis
const mockLiquids = {
  '0': {
    displayName: 'liquid1',
    description: 'my liquid',
    displayColor: '#00d781',
  },
  '1': {
    displayName: 'liquid 2',
    description: 'second liquid',
    displayColor: '#0076ff',
  },
  '2': {
    displayName: 'liquid 3',
    description: 'sample',
    displayColor: '#ff4888',
  },
  '3': {
    displayName: 'liquid 4',
    description: 'sample 4',
    displayColor: '#50d5ff',
  },
}
const mockLabware = {
  'b1e79d50-e112-11ec-8729-359ce212aee2:opentrons/eppendorf_96_tiprack_10ul_eptips/1': {
    displayName: 'Eppendorf Tips',
    definitionId: 'opentrons/eppendorf_96_tiprack_10ul_eptips/1',
  },
  'f2ded1f0-e1d7-11ec-8729-359ce212aee2': {
    displayName: 'Well Plate',
    definitionId: 'example/plate/1',
  },
  '08433310-e1d8-11ec-8729-359ce212aee2:opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1': {
    displayName: 'Opentrons Tube Rack',
    definitionId:
      'opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1',
  },
}
const mockCommands = [
  {
    key: '61731400-e1d8-11ec-8729-359ce212aee2',
    commandType: 'loadPipette',
    params: {
      pipetteId: 'b1e5a180-e112-11ec-8729-359ce212aee2',
      mount: 'left',
    },
  },
  {
    key: '61731401-e1d8-11ec-8729-359ce212aee2',
    commandType: 'loadLabware',
    params: {
      labwareId:
        'b1e79d50-e112-11ec-8729-359ce212aee2:opentrons/eppendorf_96_tiprack_10ul_eptips/1',
      location: { slotName: '1' },
    },
  },
  {
    key: '61731402-e1d8-11ec-8729-359ce212aee2',
    commandType: 'loadLabware',
    params: {
      labwareId: 'f2ded1f0-e1d7-11ec-8729-359ce212aee2',
      location: { slotName: '2' },
    },
  },
  {
    key: '61731403-e1d8-11ec-8729-359ce212aee2',
    commandType: 'loadLabware',
    params: {
      labwareId:
        '08433310-e1d8-11ec-8729-359ce212aee2:opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1',
      location: { slotName: '10' },
    },
  },
  {
    commandType: 'loadLiquid',
    key: '61733b11-e1d8-11ec-8729-359ce212aee2',
    params: {
      liquidId: '2',
      labwareId:
        '08433310-e1d8-11ec-8729-359ce212aee2:opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1',
      volumeByWell: { C1: 50, C2: 50 },
    },
  },
  {
    commandType: 'loadLiquid',
    key: '61733b10-e1d8-11ec-8729-359ce212aee2',
    params: {
      liquidId: '1',
      labwareId:
        '08433310-e1d8-11ec-8729-359ce212aee2:opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1',
      volumeByWell: { A3: 150, B3: 150, A4: 150, B4: 150 },
    },
  },
  {
    commandType: 'loadLiquid',
    key: '61731404-e1d8-11ec-8729-359ce212aee2',
    params: {
      liquidId: '0',
      labwareId:
        '08433310-e1d8-11ec-8729-359ce212aee2:opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1',
      volumeByWell: { A1: 20, B1: 20, A2: 20, B2: 20 },
    },
  },
  {
    commandType: 'loadLiquid',
    key: '61731404-e1d8-11ec-8729-359ce212bee2',
    params: {
      liquidId: '3',
      labwareId:
        'b1e79d50-e112-11ec-8729-359ce212aee2:opentrons/eppendorf_96_tiprack_10ul_eptips/1',
      volumeByWell: { A2: 20, B2: 20, A3: 20, B3: 20 },
    },
  },
  {
    commandType: 'loadLiquid',
    key: '61731404-e1d8-11ec-8729-359ce212bee2',
    params: {
      liquidId: '3',
      labwareId: 'f2ded1f0-e1d7-11ec-8729-359ce212aee2',
      volumeByWell: { A2: 20, B2: 20, A3: 20, B3: 20 },
    },
  },
]

export interface Liquid {
  liquidId: string
  displayName: string
  description: string
  displayColor: string
  locations: Array<{
    slotName: string
    labwareName: string
    volumeByWell: { [well: string]: number }
    labwareId?: string
  }>
}

export function getMockLiquidData(): Liquid[] {
  const loadLiquidCommands = mockCommands.filter(
    command => command.commandType === 'loadLiquid'
  )
  const loadLabwareCommands = mockCommands.filter(
    command => command.commandType === 'loadLabware'
  )
  const mockLiquidEntries = Object.entries(mockLiquids)
  const mockLabwareEntries = Object.entries(mockLabware)

  const liquids: Liquid[] = []

  mockLiquidEntries.forEach(liquid => {
    const commandsByLiquidId = loadLiquidCommands.filter(
      command => command.params.liquidId === liquid[0]
    )
    const locations: Array<{
      slotName: string
      labwareName: string
      volumeByWell: { [well: string]: number }
      labwareId?: string
    }> = []
    commandsByLiquidId.forEach(command => {
      const labwareIndex = mockLabwareEntries.findIndex(
        labware => labware[0] === command.params.labwareId
      )
      const displayName = mockLabwareEntries[labwareIndex][1].displayName

      const loadLabwareCommandById = loadLabwareCommands.filter(
        labware => labware.params.labwareId === command.params.labwareId
      )
      const slot =
        loadLabwareCommandById[0].params.location?.slotName != null
          ? loadLabwareCommandById[0].params.location?.slotName
          : ''

      const volumeByWell =
        command.params.volumeByWell != null ? command.params.volumeByWell : {}

      locations.push({
        slotName: slot,
        labwareName: displayName,
        volumeByWell: volumeByWell,
        labwareId: command.params.labwareId,
      })
    })

    liquids.push({
      liquidId: liquid[0] ?? '',
      displayName: liquid[1].displayName,
      description: liquid[1].description,
      displayColor: liquid[1].displayColor,
      locations: locations,
    })
  })
  return liquids
}
