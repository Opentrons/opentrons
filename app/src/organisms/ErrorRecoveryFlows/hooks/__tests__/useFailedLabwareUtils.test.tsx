import { describe, it, expect, vi } from 'vitest'
import { screen, renderHook } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  getRelevantWellName,
  getRelevantFailedLabwareCmdFrom,
  useRelevantFailedLwLocations,
  useFailedLabwareUtils,
  getFailedCmdRelevantLabware,
} from '../useFailedLabwareUtils'
import { DEFINED_ERROR_TYPES } from '../../constants'

import type { ComponentProps } from 'react'
import type { GetRelevantLwLocationsParams } from '../useFailedLabwareUtils'

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

const TestWrapper = (props: GetRelevantLwLocationsParams) => {
  const displayLocation = useRelevantFailedLwLocations(props)
  return (
    <>
      <div>{`Current Loc: ${displayLocation.displayNameCurrentLoc}`}</div>
      <div>{`New Loc: ${displayLocation.displayNameNewLoc}`}</div>
    </>
  )
}

const render = (props: ComponentProps<typeof TestWrapper>) => {
  return renderWithProviders(<TestWrapper {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('useRelevantFailedLwLocations', () => {
  const mockRunRecord = { data: { modules: [], labware: [] } } as any
  const mockFailedLabware = {
    location: { slotName: 'D1' },
  } as any

  it('should return current location for non-moveLabware commands', () => {
    const mockFailedCommand = {
      commandType: 'aspirate',
    } as any

    render({
      failedLabware: mockFailedLabware,
      failedCommandByRunRecord: mockFailedCommand,
      runRecord: mockRunRecord,
    })

    screen.getByText('Current Loc: Slot D1')
    screen.getByText('New Loc: null')

    const { result } = renderHook(() =>
      useRelevantFailedLwLocations({
        failedLabware: mockFailedLabware,
        failedCommandByRunRecord: mockFailedCommand,
        runRecord: mockRunRecord,
      })
    )

    expect(result.current.currentLoc).toStrictEqual({ slotName: 'D1' })
    expect(result.current.newLoc).toBeNull()
  })

  it('should return current and new locations for moveLabware commands', () => {
    const mockFailedCommand = {
      commandType: 'moveLabware',
      params: {
        newLocation: { slotName: 'C2' },
      },
    } as any

    render({
      failedLabware: mockFailedLabware,
      failedCommandByRunRecord: mockFailedCommand,
      runRecord: mockRunRecord,
    })

    screen.getByText('Current Loc: Slot D1')
    screen.getByText('New Loc: Slot C2')

    const { result } = renderHook(() =>
      useRelevantFailedLwLocations({
        failedLabware: mockFailedLabware,
        failedCommandByRunRecord: mockFailedCommand,
        runRecord: mockRunRecord,
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

    const result = getFailedCmdRelevantLabware(
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

    const result = getFailedCmdRelevantLabware(
      mockProtocolAnalysis,
      mockCommand,
      mockRunRecord
    )

    expect(result).toBeNull()
  })

  it('should return null when command is null', () => {
    const result = getFailedCmdRelevantLabware(
      mockProtocolAnalysis,
      null,
      mockRunRecord
    )

    expect(result).toBeNull()
  })
})

describe('getRelevantPickUpTipCommand', () => {
  it('should return null when failedCommandByRunRecord does not have pipetteId in params', () => {
    const failedCommand = {
      commandType: 'dispenseInPlace',
      params: {
        wellName: 'A1',
      },
    } as any

    const runCommands = {
      data: [failedCommand],
    } as any

    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: { byRunRecord: failedCommand } as any,
      runCommands,
    })

    expect(result).toBeNull()
  })

  it('should return pickUpTip command when failedCommandByRunRecord has pipetteId', () => {
    const pickUpTipCommand = {
      key: 'pickUpTipKey',
      commandType: 'pickUpTip',
      params: {
        pipetteId: 'pipetteId',
        labwareId: 'labwareId',
        wellName: 'A1',
      },
    } as any

    const failedCommand = {
      key: 'failedKey',
      commandType: 'dispenseInPlace',
      params: {
        pipetteId: 'pipetteId',
        labwareId: 'labwareId',
      },
      error: { isDefined: true, errorType: DEFINED_ERROR_TYPES.OVERPRESSURE },
    } as any

    const runCommands = {
      data: [pickUpTipCommand, failedCommand],
    } as any

    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: { byRunRecord: failedCommand } as any,
      runCommands,
    })

    expect(result).toBe(pickUpTipCommand)
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
