import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { formatDistance } from 'date-fns'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useProtocolQuery } from '@opentrons/react-api-client'
import { RUN_STATUS_FAILED } from '@opentrons/api-client'
import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { Skeleton } from '../../../../atoms/Skeleton'
import { useMissingProtocolHardware } from '../../../../pages/Protocols/hooks'
import { useTrackProtocolRunEvent } from '../../../Devices/hooks'
import { useTrackEvent } from '../../../../redux/analytics'
import { useCloneRun } from '../../../ProtocolUpload/hooks'
import { useHardwareStatusText } from '../hooks'
import { RecentRunProtocolCard } from '../'
import { useNotifyAllRunsQuery } from '../../../../resources/runs'
import {
  useRobotInitializationStatus,
  INIT_STATUS,
} from '../../../../resources/health/hooks'

import type { ProtocolHardware } from '../../../../pages/Protocols/hooks'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../atoms/Skeleton')
vi.mock('../../../../pages/Protocols/hooks')
vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../../organisms/RunTimeControl/hooks')
vi.mock('../../../../organisms/ProtocolUpload/hooks')
vi.mock('../../../../redux/analytics')
vi.mock('../hooks')
vi.mock('../../../../resources/runs')
vi.mock('../../../../resources/health/hooks')

const RUN_ID = 'mockRunId'
const ROBOT_NAME = 'otie'

const mockMissingPipette = [
  {
    hardwareType: 'pipette',
    pipetteName: 'p1000_single_flex',
    mount: 'left',
    connected: false,
  },
] as ProtocolHardware[]

const mockMissingModule = [
  {
    hardwareType: 'module',
    moduleModel: 'temperatureModuleV2',
    slot: '1',
    connected: false,
  },
] as ProtocolHardware[]

const missingBoth = [
  {
    hardwareType: 'pipette',
    pipetteName: 'p1000_single_flex',
    mount: 'left',
    connected: false,
  },
  {
    hardwareType: 'module',
    moduleModel: 'temperatureModuleV2',
    slot: '1',
    connected: false,
  },
] as ProtocolHardware[]

const mockRunData = {
  id: RUN_ID,
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  completedAt: 'thistime',
  startedAt: 'thistime',
  protocolId: 'mockProtocolId',
  status: RUN_STATUS_FAILED,
} as any

const mockCloneRun = vi.fn()

const render = (props: React.ComponentProps<typeof RecentRunProtocolCard>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RecentRunProtocolCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockTrackEvent = vi.fn()
const mockTrackProtocolRunEvent = vi.fn(
  () => new Promise(resolve => resolve({}))
)

describe('RecentRunProtocolCard', () => {
  let props: React.ComponentProps<typeof RecentRunProtocolCard>

  beforeEach(() => {
    props = {
      runData: mockRunData,
    }

    vi.mocked(Skeleton).mockReturnValue(<div>mock Skeleton</div>)
    vi.mocked(useHardwareStatusText).mockReturnValue('Ready to run')
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: [],
      isLoading: false,
      conflictedSlots: [],
    })
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    vi.mocked(useProtocolQuery).mockReturnValue({
      data: { data: { metadata: { protocolName: 'mockProtocol' } } },
    } as any)
    vi.mocked(useRobotInitializationStatus).mockReturnValue(
      INIT_STATUS.SUCCEEDED
    )
    when(useTrackProtocolRunEvent).calledWith(RUN_ID, ROBOT_NAME).thenReturn({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
    when(useCloneRun)
      .calledWith(RUN_ID, expect.anything())
      .thenReturn({ cloneRun: mockCloneRun, isLoading: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render text', () => {
    render(props)
    const lastRunTime = formatDistance(
      new Date(mockRunData.createdAt),
      new Date(),
      {
        addSuffix: true,
      }
    ).replace('about ', '')
    screen.getByText('Ready to run')
    screen.getByText('mockProtocol')
    screen.getByText(`Failed ${lastRunTime}`)
  })

  it('should render missing chip when missing a pipette', () => {
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: mockMissingPipette,
      isLoading: false,
      conflictedSlots: [],
    })
    vi.mocked(useHardwareStatusText).mockReturnValue('Missing 1 pipette')
    render(props)
    screen.getByText('Missing 1 pipette')
  })

  it('should render missing chip when conflicted fixture', () => {
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: [],
      isLoading: false,
      conflictedSlots: ['cutoutD3'],
    })
    vi.mocked(useHardwareStatusText).mockReturnValue('Location conflicts')
    render(props)
    screen.getByText('Location conflicts')
  })

  it('should render missing chip when missing a module', () => {
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: mockMissingModule,
      isLoading: false,
      conflictedSlots: [],
    })
    vi.mocked(useHardwareStatusText).mockReturnValue('Missing 1 module')
    render(props)
    screen.getByText('Missing 1 module')
  })

  it('should render missing chip (module and pipette) when missing a pipette and a module', () => {
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: missingBoth,
      isLoading: false,
      conflictedSlots: [],
    })
    vi.mocked(useHardwareStatusText).mockReturnValue('Missing hardware')
    render(props)
    screen.getByText('Missing hardware')
  })

  it('when tapping a card, mock functions is called and loading state is activated', () => {
    render(props)
    const button = screen.getByLabelText('RecentRunProtocolCard')
    expect(button).toHaveStyle(`background-color: ${COLORS.green40}`)
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'proceedToRun',
      properties: { sourceLocation: 'RecentRunProtocolCard' },
    })
    // TODO(BC, 08/30/23): reintroduce check for tracking when tracking is reintroduced lazily
    // expect(mockTrackProtocolRunEvent).toBeCalledWith({ name: 'runAgain' })
    screen.getByLabelText('icon_ot-spinner')
    expect(button).toHaveStyle(`background-color: ${COLORS.green40}`)
  })

  it('should render the skeleton when react query is loading', () => {
    vi.mocked(useProtocolQuery).mockReturnValue({
      isLoading: true,
      data: { data: { metadata: { protocolName: 'mockProtocol' } } },
    } as any)
    render(props)
    screen.getByText('mock Skeleton')
  })

  it('should render the skeleton when the robot server is initializing', () => {
    vi.mocked(useRobotInitializationStatus).mockReturnValue(
      INIT_STATUS.INITIALIZING
    )
    const [{ getByText }] = render(props)
    getByText('mock Skeleton')
  })

  it('should render the skeleton when the robot server is unresponsive', () => {
    vi.mocked(useRobotInitializationStatus).mockReturnValue(null)
    const [{ getByText }] = render(props)
    getByText('mock Skeleton')
  })
})
