import * as React from 'react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandText } from '../CommandText'
import { useProtocolDetails } from '../hooks'
import { useLabwareRenderInfoById } from '../../ProtocolSetup/hooks'
import { getLabwareLocation } from '../../ProtocolSetup/utils/getLabwareLocation'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { ProtocolSetupInfo } from './../ProtocolSetupInfo'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

jest.mock('../hooks')
jest.mock('../../ProtocolSetup/hooks')
jest.mock('../../ProtocolSetup/utils/getLabwareLocation')
jest.mock('./../ProtocolSetupInfo')
jest.mock('@opentrons/shared-data/js/helpers')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockUseLabwareRenderInfoById = useLabwareRenderInfoById as jest.MockedFunction<
  typeof useLabwareRenderInfoById
>
const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>
const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const mockProtocolSetupInfo = ProtocolSetupInfo as jest.MockedFunction<
  typeof ProtocolSetupInfo
>

const render = (props: React.ComponentProps<typeof CommandText>) => {
  return renderWithProviders(<CommandText {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_COMMAND_DETAILS = {
  id: '123',
  commandType: 'custom',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as Command

const MOCK_PAUSE_COMMAND = {
  id: '1234',
  commandType: 'pause',
  params: { message: 'THIS IS THE PAUSE MESSAGE' },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
}

const MOCK_LOAD_COMMAND = {
  id: '1234',
  commandType: 'loadModule',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
}

describe('CommandText', () => {
  beforeEach(() => {
    mockUseProtocolDetails.mockReturnValue({ protocolData: {} } as any)
    mockUseLabwareRenderInfoById.mockReturnValue({} as any)
    mockProtocolSetupInfo.mockReturnValue(<div>Mock Protocol Setup Step</div>)
  })
  it('renders correct command text for custom legacy commands', () => {
    const { getByText } = render({
      commandOrSummary: {
        ...MOCK_COMMAND_DETAILS,
        params: {
          legacyCommandText: 'legacy command text',
        },
      } as Command,
    })
    getByText('legacy command text')
  })
  it('renders correct command text for pause commands', () => {
    const { getByText } = render({
      commandOrSummary: {
        ...MOCK_PAUSE_COMMAND,
      } as Command,
    })
    getByText('THIS IS THE PAUSE MESSAGE')
  })
  it('renders correct command text for load commands', () => {
    const { getByText } = render({
      commandOrSummary: {
        ...MOCK_LOAD_COMMAND,
      } as Command,
    })
    getByText('Mock Protocol Setup Step')
  })

  it('renders correct command text for pick up tip', () => {
    const labwareId = 'labwareId'
    const wellName = 'wellName'
    when(mockGetLabwareDisplayName)
      .calledWith('fake_def' as any)
      .mockReturnValue('fake_display_name')
    when(mockGetLabwareLocation)
      .calledWith(labwareId, [])
      .mockReturnValue({ slotName: 'fake_labware_location' })
    mockUseLabwareRenderInfoById.mockReturnValue({
      labwareId: {
        labwareDef: 'fake_def',
      },
    } as any)
    const { getByText } = render({
      commandOrSummary: {
        ...MOCK_COMMAND_DETAILS,
        commandType: 'pickUpTip',
        params: {
          wellName,
          labwareId,
        },
      } as Command,
    })
    getByText(
      'Picking up tip from wellName of fake_display_name in fake_labware_location'
    )
  })
})
