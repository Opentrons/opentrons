import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FLEX_STACKER_MODULE_V1 } from '@opentrons/shared-data'

import { DEFINED_ERROR_TYPES, ERROR_KINDS } from '../../constants'
import {
  getFailedLabwareQuantity,
  getLabwareDisplayNamesFromFailedCmd,
  getRelevantFailedLabwareCmdFrom,
  getRelevantWellName,
  useFailedLabwareUtils,
  useRelevantFailedLwLocations,
} from '../useFailedLabwareUtils'

import type { RunCurrentState } from '@opentrons/api-client'

vi.mock('@opentrons/shared-data', async () => {
  const actual = await vi.importActual('@opentrons/shared-data')
  return {
    ...actual,
    getLabwareDisplayName: vi.fn(() => 'Mock Labware Name'),
    getAllLabwareDefs: vi.fn(() => ({
      'opentrons/thermoscientificnunc_96_wellplate_1300ul/1': {
        some: 'definition',
      },
    })),
    getLoadedLabwareDefinitionsByUri: vi.fn(() => ({
      'some/uri': { some: 'definition' },
    })),
  }
})

vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    getLabwareDisplayLocation: vi.fn(params =>
      params.location ? `Slot ${params.location.slotName}` : ''
    ),
    getLoadedLabware: vi.fn(() => ({ displayName: 'Mock Nickname' })),
  }
})
vi.mock('@opentrons/shared-data', async () => {
  const actual = await vi.importActual('@opentrons/shared-data')
  return {
    ...actual,
    getLabwareDisplayName: vi.fn(() => 'Mock Labware Name'),
    getAllLabwareDefs: vi.fn(() => ({
      'opentrons/thermoscientificnunc_96_wellplate_1300ul/1': {
        some: 'definition',
      },
    })),
    getLoadedLabwareDefinitionsByUri: vi.fn(() => ({
      'some/uri': { some: 'definition' },
    })),
  }
})

vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    getLabwareDisplayLocation: vi.fn(params =>
      params.location ? `Slot ${params.location.slotName}` : ''
    ),
    getLoadedLabware: vi.fn(() => ({ displayName: 'Mock Nickname' })),
  }
})
describe('getRelevantWellName', () => {
  const failedPipetteInfo = {
    data: {
      channels: 8,
    },
  } as any

  const recentRelevantPickUpTipCmd = {
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'labwareId',
      wellName: 'A1',
    },
  } as any

  it('should return an empty string if failedPipetteInfo is null', () => {
    const result = getRelevantWellName(null, recentRelevantPickUpTipCmd)
    expect(result).toBe('')
  })

  it('should return an empty string if recentRelevantPickUpTipCmd is null', () => {
    const result = getRelevantWellName(failedPipetteInfo, null)
    expect(result).toBe('')
  })

  it('should return the wellName if the pipette has 1 channel', () => {
    const result = getRelevantWellName(
      { ...failedPipetteInfo, data: { channels: 1 } },
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1')
  })

  it('should return a range of well names if the pipette has 8 channels', () => {
    const result = getRelevantWellName(
      failedPipetteInfo,
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1 - H1')
  })

  it('should return the wellName if the pipette has 96 channels', () => {
    const result = getRelevantWellName(
      { ...failedPipetteInfo, data: { channels: 96 } },
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1')
  })

  it('should handle different wellName formats correctly', () => {
    const result = getRelevantWellName(failedPipetteInfo, {
      ...recentRelevantPickUpTipCmd,
      params: { ...recentRelevantPickUpTipCmd.params, wellName: 'B12' },
    })
    expect(result).toBe('A12 - H12')
  })
})

describe('getRelevantFailedLabwareCmdFrom', () => {
  const failedCommand = {
    error: {
      errorType: DEFINED_ERROR_TYPES.LIQUID_NOT_FOUND,
    },
    params: {
      wellName: 'A1',
      pipetteId: 'pipetteId',
    },
  } as any

  it('should return the failedCommand for NO_LIQUID_DETECTED error kind', () => {
    const failedLiquidProbeCommand = {
      ...failedCommand,
      commandType: 'liquidProbe',
      error: {
        isDefined: true,
        errorType: DEFINED_ERROR_TYPES.LIQUID_NOT_FOUND,
      },
    }
    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: { byRunRecord: failedLiquidProbeCommand } as any,
    })
    expect(result).toEqual(failedLiquidProbeCommand)
  })

  it('should return the relevant pickUpTip command for overpressure error kinds', () => {
    const pickUpTipCommand = {
      commandType: 'pickUpTip',
      params: {
        pipetteId: 'pipetteId',
        labwareId: 'labwareId',
        wellName: 'A1',
      },
    } as any
    const runCommands = {
      data: [pickUpTipCommand, failedCommand],
    } as any

    const overpressureErrorKinds = [
      ['aspirate', DEFINED_ERROR_TYPES.OVERPRESSURE],
      ['dispense', DEFINED_ERROR_TYPES.OVERPRESSURE],
    ]

    overpressureErrorKinds.forEach(([commandType, errorType]) => {
      const result = getRelevantFailedLabwareCmdFrom({
        failedCommand: {
          byRunRecord: {
            ...failedCommand,
            commandType,
            error: { isDefined: true, errorType },
          },
        } as any,
        runCommands,
      })
      expect(result).toBe(pickUpTipCommand)
    })
  })

  it('should return the relevant retrieve command for stacker error kinds', () => {
    const retrieveCommand = {
      commandType: 'flexStacker/retrieve',
      params: {
        moduleId: 'module-id',
      },
    } as any

    const retrieveErrorKinds = [
      ['flexStacker/retrieve', DEFINED_ERROR_TYPES.HOPPER_LABWARE_MISSING],
      ['flexStacker/retrieve', DEFINED_ERROR_TYPES.STACKER_SHUTTLE_MISSING],
      ['flexStacker/retrieve', DEFINED_ERROR_TYPES.STACKER_STALL],
    ]

    retrieveErrorKinds.forEach(([commandType, errorType]) => {
      const failedRetrieveCommand = {
        commandType: 'flexStacker/retrieve',
        params: {
          moduleId: 'module-id',
        },
        error: {
          isDefined: true,
          errorType,
        },
      }
      const runCommands = {
        data: [retrieveCommand, failedRetrieveCommand],
      } as any
      const result = getRelevantFailedLabwareCmdFrom({
        failedCommand: {
          byRunRecord: {
            ...failedRetrieveCommand,
            commandType,
            error: { isDefined: true, errorType },
          },
        } as any,
        runCommands,
      })
      expect(result).toStrictEqual(failedRetrieveCommand)
    })
  })

  it('should return the failedCommand for GRIPPER_ERROR error kind', () => {
    const failedGripperCommand = {
      ...failedCommand,
      commandType: 'moveLabware',
      error: {
        isDefined: true,
        errorType: DEFINED_ERROR_TYPES.GRIPPER_MOVEMENT,
      },
    }
    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: { byRunRecord: failedGripperCommand } as any,
    })
    expect(result).toEqual(failedGripperCommand)
  })

  it('should return null for GENERAL_ERROR error kind', () => {
    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: {
        byRunRecord: {
          ...failedCommand,
          error: {
            errorType: 'literally anything else',
          },
        },
      } as any,
    })
    expect(result).toBeNull()
  })

  it('should return null for unhandled error kinds', () => {
    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: {
        byRunRecord: {
          ...failedCommand,
          error: { errorType: 'SOME_UNHANDLED_ERROR' },
        },
      } as any,
    })
    expect(result).toBeNull()
  })
})

describe('getFailedLabwareQuantity', () => {
  const failedCommand = {
    id: 'failed-command-id',
    error: {
      errorType: DEFINED_ERROR_TYPES.STACKER_STALL,
    },
    params: {
      moduleId: 'module-id',
    },
  } as any

  it('should return the quantity for stacker error kinds', () => {
    const errors = [
      ERROR_KINDS.STACKER_SHUTTLE_MISSING,
      ERROR_KINDS.STACKER_HOPPER_EMPTY,
      ERROR_KINDS.STACKER_STALLED,
    ]
    errors.forEach(errorType => {
      const failedLocalRetriveCommand = {
        byRunRecord: {
          ...failedCommand,
          error: { errorType: 'SOME_UNHANDLED_ERROR' },
        },
        byAnalysis: {
          ...failedCommand,
          error: { errorType: 'SOME_UNHANDLED_ERROR' },
        },
      }

      const currentRunState = {
        data: {
          estopEngaged: false,
          activeNozzleLayouts: {
            abc: {
              startingNozzle: 'A1',
              activeNozzles: ['A1'],
              config: 'single',
            },
          },
          tipStates: { abc: { hasTip: false } },
          placeLabwareState: undefined,
          flexStackerStates: {
            'module-id': {
              primaryLabwareURI: 'huh',
              adapterLabwareURI: 'whu',
              lidLabwareURI: 'buh',
              count: 4,
              maxCount: 5,
            },
          },
        },
        links: { lastCompleted: { id: 'test', href: 'test2' } },
      }

      const result = getFailedLabwareQuantity(
        failedLocalRetriveCommand,
        currentRunState as RunCurrentState
      )
      expect(result).toEqual(4)
    })
  })

  it('should return the quantity for stacker error kinds based on result property', () => {
    const errors = [
      ERROR_KINDS.STACKER_SHUTTLE_MISSING,
      ERROR_KINDS.STACKER_HOPPER_EMPTY,
      ERROR_KINDS.STACKER_STALLED,
    ]
    errors.forEach(errorKind => {
      const failedLocalRetriveCommand = {
        byRunRecord: {
          ...failedCommand,
          error: { errorType: errorKind },
        },
        byAnalysis: {
          ...failedCommand,
          error: { errorType: errorKind },
        },
      }

      const currentRunState = {
        data: {
          estopEngaged: false,
          activeNozzleLayouts: {
            abc: {
              startingNozzle: 'A1',
              activeNozzles: ['A1'],
              config: 'single',
            },
          },
          tipStates: { abc: { hasTip: false } },
          placeLabwareState: undefined,
          flexStackerStates: {
            'module-id': {
              primaryLabwareURI: 'huh',
              adapterLabwareURI: 'whu',
              lidLabwareURI: 'buh',
              count: 4,
              maxCount: 5,
            },
          },
        },
        links: { lastCompleted: { id: 'test', href: 'test2' } },
      }
      const result = getFailedLabwareQuantity(
        failedLocalRetriveCommand,
        currentRunState as RunCurrentState
      )
      expect(result).toEqual(4)
    })
  })

  it('should return 0 if there is no commands in list', () => {
    const failedLocalRetriveCommand = {
      byRunRecord: {
        ...failedCommand,
        error: { errorType: ERROR_KINDS.STACKER_STALLED },
      },
      byAnalysis: {
        ...failedCommand,
        error: { errorType: ERROR_KINDS.STACKER_STALLED },
      },
    }

    const currentRunState = {
      data: {
        estopEngaged: false,
        activeNozzleLayouts: {
          abc: {
            startingNozzle: 'A1',
            activeNozzles: ['A1'],
            config: 'single',
          },
        },
        tipStates: { abc: { hasTip: false } },
        placeLabwareState: undefined,
        flexStackerStates: {
          'module-id': {
            primaryLabwareURI: 'huh',
            adapterLabwareURI: 'whu',
            lidLabwareURI: 'buh',
            count: 0,
            maxCount: 5,
          },
        },
      },
      links: { lastCompleted: { id: 'test', href: 'test2' } },
    }
    const result = getFailedLabwareQuantity(
      failedLocalRetriveCommand,
      currentRunState as RunCurrentState
    )
    expect(result).toEqual(0)
  })

  it('should return null if there is no runCommands', () => {
    const failedLocalRetriveCommand = null

    const currentRunState = undefined
    const result = getFailedLabwareQuantity(
      failedLocalRetriveCommand,
      currentRunState
    )
    expect(result).toBeNull()
  })
})

describe('useRelevantFailedLwLocations', () => {
  const mockRunRecord = {
    data: {
      modules: [
        {
          id: 'module-id',
          model: FLEX_STACKER_MODULE_V1,
          location: { slotName: 'D1' },
        },
      ],
      labware: [],
    },
  } as any
  const mockFailedLabware = {
    location: { slotName: 'D1' },
  } as any

  it('should return current location for non-moveLabware commands', () => {
    const mockFailedCommand = {
      commandType: 'aspirate',
    } as any

    const { result } = renderHook(() =>
      useRelevantFailedLwLocations({
        failedLabware: mockFailedLabware,
        failedCommandByRunRecord: mockFailedCommand,
        runRecord: mockRunRecord,
        errorKind: ERROR_KINDS.GENERAL_ERROR,
      })
    )

    expect(result.current.currentLoc).toStrictEqual({ slotName: 'D1' })
    expect(result.current.newLoc).toBeNull()
  })

  it('should return current location for flex stacker commands', () => {
    const mockFailedCommand = {
      commandType: 'flexStacker/retrieve',
      location: { slotName: 'D3' },
      params: {
        moduleId: 'module-id',
      },
    } as any

    const { result } = renderHook(() =>
      useRelevantFailedLwLocations({
        failedLabware: mockFailedLabware,
        failedCommandByRunRecord: mockFailedCommand,
        runRecord: mockRunRecord,
        errorKind: ERROR_KINDS.STACKER_STALLED,
      })
    )

    expect(result.current.currentLoc).toStrictEqual({ slotName: 'D1' })
    expect(result.current.newLoc).toStrictEqual({ moduleId: 'module-id' })
  })

  it('should return current and new locations for moveLabware commands', () => {
    const mockFailedCommand = {
      commandType: 'moveLabware',
      params: {
        newLocation: { slotName: 'C2' },
      },
    } as any

    const { result } = renderHook(() =>
      useRelevantFailedLwLocations({
        failedLabware: mockFailedLabware,
        failedCommandByRunRecord: mockFailedCommand,
        runRecord: mockRunRecord,
        errorKind: ERROR_KINDS.GENERAL_ERROR,
      })
    )

    expect(result.current.currentLoc).toStrictEqual({ slotName: 'D1' })
    expect(result.current.newLoc).toStrictEqual({ slotName: 'C2' })
  })
})

describe('getFailedCmdRelevantLabware', () => {
  const mockProtocolAnalysis = {
    commands: [],
    labware: [],
  } as any

  const mockRunRecord = {
    data: {
      labware: [
        {
          id: 'labwareId',
          definitionUri: 'some/uri',
        },
      ],
    },
  } as any

  it('should return labware name and nickname when labware is found', () => {
    const mockCommand = {
      params: {
        labwareId: 'labwareId',
      },
    } as any

    const result = getLabwareDisplayNamesFromFailedCmd(
      mockProtocolAnalysis,
      mockCommand,
      mockRunRecord
    )

    expect(result).toEqual({
      name: 'Mock Labware Name',
      nickname: 'Mock Nickname',
    })
  })

  it('should return null when labware is not found', () => {
    const mockCommand = {
      params: {
        labwareId: 'nonExistentId',
      },
    } as any

    const result = getLabwareDisplayNamesFromFailedCmd(
      mockProtocolAnalysis,
      mockCommand,
      mockRunRecord
    )

    expect(result).toBeNull()
  })

  it('should return null when command is null', () => {
    const result = getLabwareDisplayNamesFromFailedCmd(
      mockProtocolAnalysis,
      null,
      mockRunRecord
    )

    expect(result).toBeNull()
  })
})

describe('useFailedLabwareUtils', () => {
  const mockPickUpTipCommand = {
    key: 'pickUpTipKey',
    commandType: 'pickUpTip',
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'tipLabwareId',
      wellName: 'A1',
    },
  } as any

  const mockFailedCommand = {
    key: 'failedKey',
    commandType: 'aspirate',
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'failedLabwareId',
      wellName: 'B2',
    },
    error: {
      errorType: DEFINED_ERROR_TYPES.OVERPRESSURE,
    },
  } as any

  const mockRunCommands = {
    data: [mockPickUpTipCommand, mockFailedCommand],
    meta: {
      totalLength: 2,
    },
  } as any

  const mockRunRecord = {
    data: {
      labware: [
        {
          id: 'failedLabwareId',
          definitionUri: 'some/uri',
          location: { slotName: 'D1' },
        },
        {
          id: 'tipLabwareId',
          definitionUri: 'some/uri',
          location: { slotName: 'C1' },
        },
      ],
    },
  } as any

  const mockPipetteInfo = {
    data: {
      channels: 8,
    },
  } as any

  const mockProtocolAnalysis = {
    id: 'analysisId',
    commands: [],
    labware: [],
  } as any

  it('should handle case when no relevant tip pickup command is found', () => {
    const noPickupCommandsRun = {
      ...mockRunCommands,
      data: [
        {
          key: 'someOtherKey',
          commandType: 'aspirate',
          params: { pipetteId: 'differentPipette' },
        },
        mockFailedCommand,
      ],
    }

    const { result } = renderHook(() =>
      useFailedLabwareUtils({
        failedCommand: { byRunRecord: mockFailedCommand } as any,
        runCommands: noPickupCommandsRun,
        runRecord: mockRunRecord,
        failedPipetteInfo: mockPipetteInfo,
        protocolAnalysis: mockProtocolAnalysis,
      })
    )

    expect(result.current.relevantPickUpTipLabware).toBeNull()
    expect(result.current.relevantPickUpTipWellName).toBe('')
    expect(result.current.selectedTipLocations).toBeNull()
    expect(result.current.areTipsSelected).toBe(false)
  })
})
