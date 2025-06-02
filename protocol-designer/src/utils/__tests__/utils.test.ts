import { describe, expect, it } from 'vitest'

import { fixture96Plate, LabwareDefinition2 } from '@opentrons/shared-data'

import {
  getAllLabwareIdsOfCertainURIOnStack,
  getMaxConditioningVolume,
  getMaxPushOutVolume,
  removeOpentronsPhrases,
} from '..'
import {
  AllTemporalPropertiesForTimelineFrame,
  LabwareOnDeck,
} from '../../step-forms'

describe('removeOpentronsPhrases', () => {
  it('should remove "Opentrons Flex 96"', () => {
    const input = 'This is an Opentrons Flex 96 Tip Rack'
    const expectedOutput = 'This is an Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "Opentrons OT-2 96"', () => {
    const input = 'This is an Opentrons OT-2 96 Tip Rack'
    const expectedOutput = 'This is an Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "(Retired)"', () => {
    const input = 'This is a (Retired) Tip Rack'
    const expectedOutput = 'This is a Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "96" if it is not the first two characters', () => {
    const input = 'This is a Filter 96 Tip Rack'
    const expectedOutput = 'This is a Filter Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "96" if it is the first two characters', () => {
    const input = '96 Filter Tip Rack'
    const expectedOutput = 'Filter Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should handle multiple phrases in the input', () => {
    const input = '(Retired) Opentrons Flex 96 and Opentrons OT-2 96 Tip Rack'
    const expectedOutput = 'and Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should handle an empty input', () => {
    const input = ''
    const expectedOutput = ''
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "Eppendorf" from input ', () => {
    const input = 'Eppendorf epT.I.P.S. Tip Rack is long'
    const expectedOutput = 'epT.I.P.S. Tip Rack is long'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })
})

describe('getMaxPushOutVolume', () => {
  const mockPipetteSpec: any = {
    plungerPositionsConfigurations: {
      default: {
        bottom: 10,
        blowout: 15,
      },
      lowVolumeDefault: {
        bottom: 5,
        blowout: 15,
      },
    },
    shaftULperMM: 0.8,
    liquids: {
      default: {
        maxVolume: 50,
        minVolume: 5,
      },
      lowVolumeDefault: {
        maxVolume: 30,
        minVolume: 1,
      },
    },
  }

  it('should calculate correct push out volume for default volume configuration ', () => {
    const result = getMaxPushOutVolume(100, mockPipetteSpec)

    expect(result).toBe(4)
  })

  it('should calculate correct push out volume for low volume configuration ', () => {
    const result = getMaxPushOutVolume(4, mockPipetteSpec)

    expect(result).toBe(8)
  })

  it('should calculate pushout volume for low volume configuration with no low volume mode properties', () => {
    const pipetteSpecNoLowVolume: any = {
      plungerPositionsConfigurations: {
        default: {
          bottom: 10,
          blowout: 15,
        },
      },
      shaftULperMM: 0.8,
      liquids: {
        default: {
          maxVolume: 50,
          minVolume: 5,
        },
      },
    }

    const result = getMaxPushOutVolume(50, pipetteSpecNoLowVolume)

    expect(result).toBe(4)
  })
})

describe('getMaxConditioningVolume', () => {
  it('should calculate the max conditioning volume with default liquid specs and tiprack volume', () => {
    const args = {
      transferVolume: 10,
      disposalVolume: 5,
      tiprackDefUri: 'opentrons/opentrons_96_tiprack_300ul/1',
      labwareEntities: {
        tiprack: {
          id: 'tiprack',
          labwareDefURI: 'opentrons/opentrons_96_tiprack_300ul/1',
          def: {
            parameters: {
              loadName: 'opentrons_96_tiprack_300ul',
            },
            wells: {
              A1: {
                totalLiquidVolume: 300,
              },
            },
          },
        },
      },
      pipetteSpecs: {
        liquids: {
          default: {
            maxVolume: 200,
            minVolume: 1,
          },
        },
      },
    } as any

    const result = getMaxConditioningVolume(args)
    expect(result).toBe(200 - 5 - 10)
  })

  it('should calculate the max conditioning volume with low volume liquid specs and tiprack volume', () => {
    const args = {
      transferVolume: 4,
      disposalVolume: 1,
      tiprackDefUri: 'opentrons/opentrons_96_tiprack_10ul/1',
      labwareEntities: {
        tiprack: {
          id: 'tiprack',
          labwareDefURI: 'opentrons/opentrons_96_tiprack_10ul/1',
          def: {
            parameters: {
              loadName: 'opentrons_96_tiprack_10ul',
            },
            wells: {
              A1: {
                totalLiquidVolume: 10,
              },
            },
          },
        },
      },
      pipetteSpecs: {
        liquids: {
          default: {
            maxVolume: 10,
            minVolume: 5,
          },
          lowVolumeDefault: {
            maxVolume: 5,
            minVolume: 0.1,
          },
        },
      },
    } as any

    const result = getMaxConditioningVolume(args)
    expect(result).toBe(5 - 4 - 1)
  })

  it('should calculate the max conditioning volume without tiprack volume', () => {
    const args = {
      transferVolume: 10,
      disposalVolume: 5,
      tiprackDefUri: 'opentrons/opentrons_96_tiprack_300ul/1',
      labwareEntities: {},
      pipetteSpecs: {
        liquids: {
          default: {
            maxVolume: 200,
            minVolume: 1,
          },
        },
      },
    } as any

    const result = getMaxConditioningVolume(args)
    expect(result).toBe(200 - 5 - 10)
  })

  it('should handle zero disposal volume', () => {
    const args = {
      transferVolume: 10,
      disposalVolume: 0,
      tiprackDefUri: 'opentrons/opentrons_96_tiprack_300ul/1',
      labwareEntities: {
        tiprack: {
          id: 'tiprack',
          labwareDefURI: 'opentrons/opentrons_96_tiprack_300ul/1',
          def: {
            parameters: {
              loadName: 'opentrons_96_tiprack_300ul',
            },
            wells: {
              A1: {
                totalLiquidVolume: 300,
              },
            },
          },
        },
      },
      pipetteSpecs: {
        liquids: {
          default: {
            maxVolume: 200,
            minVolume: 1,
          },
        },
      },
    } as any

    const result = getMaxConditioningVolume(args)
    expect(result).toBe(200 - 10)
  })
})

describe('getAllLabwareIdsOfCertainURIOnStack', () => {
  it('returns an 1 item in string when there are no duplicates on the stack', () => {
    const mockDeckSetupLabware: AllTemporalPropertiesForTimelineFrame['labware'] = {
      labware: {
        stack: ['labware', 'adapter', 'module', 'A2'],
        id: 'labware',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
        labwareDefURI: 'mockLabwareDefUri',
      },
      adapter: {
        stack: ['adapter', 'module', 'A2'],
        id: 'adapter',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
        labwareDefURI: 'mockAdapterDefUri',
      },
    }
    const mockLabwareOnDeck: LabwareOnDeck = {
      stack: ['labware', 'adapter', 'module', 'A2'],
      id: 'labware',
      def: fixture96Plate as LabwareDefinition2,
      pythonName: 'mockPythonName',
      labwareDefURI: 'mockLabwareDefUri',
    }
    expect(
      getAllLabwareIdsOfCertainURIOnStack(
        mockDeckSetupLabware,
        mockLabwareOnDeck
      )
    ).toEqual(['labware'])
  })
  it('returns an 3 items in string when there are duplicates on the stack', () => {
    const mockDeckSetupLabware: AllTemporalPropertiesForTimelineFrame['labware'] = {
      labware: {
        stack: ['labware', 'module', 'A2'],
        id: 'labware',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
        labwareDefURI: 'mockLabwareDefUri',
      },
      labware2: {
        stack: ['labware2', 'labware', 'module', 'A2'],
        id: 'labware2',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
        labwareDefURI: 'mockLabwareDefUri',
      },
      labware3: {
        stack: ['labware3', 'labware2', 'labware', 'module', 'A2'],
        id: 'labware3',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
        labwareDefURI: 'mockLabwareDefUri',
      },
    }
    const mockLabwareOnDeck: LabwareOnDeck = {
      stack: ['labware', 'adapter', 'module', 'A2'],
      id: 'labware',
      def: fixture96Plate as LabwareDefinition2,
      pythonName: 'mockPythonName',
      labwareDefURI: 'mockLabwareDefUri',
    }
    expect(
      getAllLabwareIdsOfCertainURIOnStack(
        mockDeckSetupLabware,
        mockLabwareOnDeck
      )
    ).toEqual(['labware', 'labware2', 'labware3'])
  })
})
