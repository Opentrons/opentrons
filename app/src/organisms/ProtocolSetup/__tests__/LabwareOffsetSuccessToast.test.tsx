import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/dom'
import { when } from 'jest-when'
import { renderWithProviders, anyProps } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { AlertItem } from '@opentrons/components/src/alerts'
import { LabwareOffsetSuccessToast } from '../LabwareOffsetSuccessToast'
import {
  UseCurrentProtocolRun,
  useCurrentProtocolRun,
} from '../../ProtocolUpload/hooks'
import {
  RunData,
  RUN_ACTION_TYPE_PAUSE,
  RUN_ACTION_TYPE_PLAY,
  RUN_STATUS_SUCCEEDED,
  LabwareOffset,
} from '@opentrons/api-client'

jest.mock('@opentrons/components/src/alerts')
jest.mock('../../ProtocolUpload/hooks')

const mockAlertItem = AlertItem as jest.MockedFunction<typeof AlertItem>
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>

const PROTOCOL_ID = '1'
const RUN_ID_2 = '2'
const COMMAND_ID = '4'

const mockNoOffsetsRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  labwareOffsets: [],
  status: RUN_STATUS_SUCCEEDED,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
  ],
  commands: [{ id: COMMAND_ID, commandType: 'custom', status: 'succeeded' }],
  errors: [],
  pipettes: [],
  labware: [],
}
const mock1OffsetsRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  labwareOffsets: [
    ({
      id: 'id',
      definitionUri: 'definitionUri',
      location: 'a location',
      offset: { x: 1, y: 1, z: 1 },
    } as unknown) as LabwareOffset,
  ],
  status: RUN_STATUS_SUCCEEDED,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
  ],
  commands: [{ id: COMMAND_ID, commandType: 'custom', status: 'succeeded' }],
  errors: [],
  pipettes: [],
  labware: [],
}

const render = (
  props: React.ComponentProps<typeof LabwareOffsetSuccessToast>
) => {
  return renderWithProviders(<LabwareOffsetSuccessToast {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe(' LabwareOffsetSuccessToast', () => {
  let props: React.ComponentProps<typeof LabwareOffsetSuccessToast>

  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
    when(mockAlertItem)
      .calledWith(anyProps())
      .mockReturnValue(<div>No Labware Offsets created</div>)
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mockNoOffsetsRun },
      } as UseCurrentProtocolRun)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders LPC success toast and is clickable with 0 offsets', () => {
    const { getByText } = render(props)
    expect(getByText('No Labware Offsets created')).toHaveStyle(
      'backgroundColor: c-bg-success'
    )
    const successToast = getByText('No Labware Offsets created')
    fireEvent.click(successToast)
  })
  it('renders LPC success toast and is clickable with 1 offset', () => {
    mockAlertItem.mockReturnValue(<div>1 Labware Offsets created</div>)
    const { getByText } = render(props)
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mock1OffsetsRun },
      } as UseCurrentProtocolRun)
    expect(getByText('1 Labware Offsets created')).toHaveStyle(
      'backgroundColor: c-success'
    )
    const successToast = getByText('1 Labware Offsets created')
    fireEvent.click(successToast)
    expect(successToast).toBeTruthy()
  })
})
