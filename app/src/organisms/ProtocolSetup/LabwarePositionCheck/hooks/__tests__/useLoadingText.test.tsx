import * as React from 'react'
import { when } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { I18nextProvider } from 'react-i18next'
import { getLabwareLocation } from '../../../utils/getLabwareLocation'
import { useProtocolDetails } from '../../../../RunDetails/hooks'
import { i18n } from '../../../../../i18n'
import { useTitleText } from '../useLabwarePositionCheck'
import type { MoveToWellCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type {
  DropTipCommand,
  PickUpTipCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

jest.mock('../../../../RunDetails/hooks')
jest.mock('../../../utils/getLabwareLocation')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const wrapper: React.FunctionComponent<{}> = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
)

const mockProtocolData: any = { commands: [] }
const mockLabwareId = 'mockLabwareId'
const mockSlotNumber = 'mockSlotNumber'

describe('useTitleText', () => {
  beforeEach(() => {
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      protocolData: mockProtocolData,
      displayName: 'mock display name',
    })
    when(mockGetLabwareLocation)
      .calledWith(mockLabwareId, mockProtocolData.commands)
      .mockReturnValue({ slotName: mockSlotNumber })
  })
  it('should return the loading text for a move to well command', () => {
    const command: MoveToWellCommand = {
      id: '1',
      commandType: 'moveToWell',
      params: {
        labwareId: mockLabwareId,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const { result } = renderHook(() => useTitleText(true, command), {
      wrapper,
    })
    expect(result.current).toBe(`Moving to slot ${mockSlotNumber}`)
  })
  it('should return the loading text for a move to well and pick up tip command', () => {
    const firstCommand: MoveToWellCommand = {
      id: '1',
      commandType: 'moveToWell',
      params: {
        labwareId: mockLabwareId,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const secondCommand: PickUpTipCommand = {
      id: '2',
      commandType: 'pickUpTip',
      params: {
        labwareId: mockLabwareId,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
      },
    }

    const command = firstCommand && secondCommand

    const { result } = renderHook(() => useTitleText(true, command), {
      wrapper,
    })
    expect(result.current).toBe(
      `Moving to slot ${mockSlotNumber} and picking up tip`
    )
  })
  it('should return the loading text for a move to well and returning a tip command', () => {
    const firstCommand: MoveToWellCommand = {
      id: '1',
      commandType: 'moveToWell',
      params: {
        labwareId: mockLabwareId,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const secondCommand: DropTipCommand = {
      id: '1',
      commandType: 'dropTip',
      params: {
        labwareId: mockLabwareId,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
      },
    }

    const command = firstCommand && secondCommand

    const { result } = renderHook(() => useTitleText(true, command), {
      wrapper,
    })
    expect(result.current).toBe(
      `Moving to slot ${mockSlotNumber} and returning tip`
    )
  })
})
