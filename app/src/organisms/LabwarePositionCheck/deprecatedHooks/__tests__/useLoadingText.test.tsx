import * as React from 'react'
import { when } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { I18nextProvider } from 'react-i18next'
import { getLabwareLocation } from '../../../Devices/ProtocolRun/utils/getLabwareLocation'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { i18n } from '../../../../i18n'
import { useTitleText } from '../useDeprecatedLabwarePositionCheck'
import type { MoveToWellCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type {
  DropTipCreateCommand,
  PickUpTipCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

jest.mock('../../../Devices/hooks')
jest.mock('../../../Devices/ProtocolRun/utils/getLabwareLocation')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
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
const mockRunId = 'mockRunId'

describe('useTitleText', () => {
  beforeEach(() => {
    when(mockUseProtocolDetailsForRun).calledWith(mockRunId).mockReturnValue({
      protocolData: mockProtocolData,
      displayName: 'mock display name',
      protocolKey: 'fakeProtocolKey',
      robotType: 'OT-2 Standard',
    })
    when(mockGetLabwareLocation)
      .calledWith(mockLabwareId, mockProtocolData.commands)
      .mockReturnValue({ slotName: mockSlotNumber })
  })
  it('should return the loading text for a move to well command', () => {
    const command: MoveToWellCreateCommand = {
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

    const { result } = renderHook(
      () => useTitleText(true, command, mockRunId),
      {
        wrapper,
      }
    )
    expect(result.current).toBe(`Moving to slot ${mockSlotNumber}`)
  })
  it('should return the loading text for a pick up tip command', () => {
    const command: PickUpTipCreateCommand = {
      commandType: 'pickUpTip',
      params: {
        labwareId: mockLabwareId,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
      },
    }

    const { result } = renderHook(
      () => useTitleText(true, command, mockRunId),
      {
        wrapper,
      }
    )
    expect(result.current).toBe(`Picking up tip in slot ${mockSlotNumber}`)
  })
  it('should return the loading text for a drop tip command', () => {
    const command: DropTipCreateCommand = {
      commandType: 'dropTip',
      params: {
        labwareId: mockLabwareId,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
      },
    }

    const { result } = renderHook(
      () => useTitleText(true, command, mockRunId),
      {
        wrapper,
      }
    )
    expect(result.current).toBe(`Returning tip in slot ${mockSlotNumber}`)
  })
})
