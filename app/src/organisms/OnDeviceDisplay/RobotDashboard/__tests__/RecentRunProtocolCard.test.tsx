import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { formatDistance } from 'date-fns'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

<<<<<<< HEAD
import {
  useProtocolQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import {
  RUN_STATUS_FAILED,
  simpleAnalysisFileFixture,
} from '@opentrons/api-client'
=======
import { useProtocolQuery } from '@opentrons/react-api-client'
import { RUN_STATUS_FAILED } from '@opentrons/api-client'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { Skeleton } from '../../../../atoms/Skeleton'
import { useMissingProtocolHardware } from '../../../../pages/Protocols/hooks'
import { useTrackProtocolRunEvent } from '../../../Devices/hooks'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../../redux/analytics'
import { useCloneRun } from '../../../ProtocolUpload/hooks'
import { useRerunnableStatusText } from '../hooks'
import { RecentRunProtocolCard } from '../'
import { useNotifyAllRunsQuery } from '../../../../resources/runs'
import {
  useRobotInitializationStatus,
  INIT_STATUS,
} from '../../../../resources/health/hooks'

import type { useHistory } from 'react-router-dom'
import type { ProtocolHardware } from '../../../../pages/Protocols/hooks'

<<<<<<< HEAD
const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../atoms/Skeleton')
vi.mock('../../../../pages/Protocols/hooks')
vi.mock('../../../../pages/ProtocolDetails')
=======
vi.mock('@opentrons/react-api-client')
vi.mock('../../../../atoms/Skeleton')
vi.mock('../../../../pages/Protocols/hooks')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../../organisms/RunTimeControl/hooks')
vi.mock('../../../../organisms/ProtocolUpload/hooks')
vi.mock('../../../../redux/analytics')
vi.mock('../hooks')
<<<<<<< HEAD
vi.mock('../../../../resources/runs')
=======
vi.mock('../../../../resources/runs/useNotifyAllRunsQuery')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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

<<<<<<< HEAD
const mockBadRunData = {
  ...mockRunData,
  ok: false,
  dataError: {
    title: 'Bad run oh no',
  },
} as any

=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
<<<<<<< HEAD
    vi.mocked(useRerunnableStatusText).mockReturnValue('Ready to run')
=======
    vi.mocked(useHardwareStatusText).mockReturnValue('Ready to run')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
<<<<<<< HEAD
      data: {
        data: {
          metadata: { protocolName: 'mockProtocol' },
          id: 'mockProtocolId',
        },
      },
    } as any)
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: {
        ...simpleAnalysisFileFixture,
        runTimeParameters: [],
      },
    } as any)
=======
      data: { data: { metadata: { protocolName: 'mockProtocol' } } },
    } as any)
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
<<<<<<< HEAD
    vi.mocked(useRerunnableStatusText).mockReturnValue('Missing 1 pipette')
=======
    vi.mocked(useHardwareStatusText).mockReturnValue('Missing 1 pipette')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
    render(props)
    screen.getByText('Missing 1 pipette')
  })

  it('should render missing chip when conflicted fixture', () => {
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: [],
      isLoading: false,
      conflictedSlots: ['cutoutD3'],
    })
<<<<<<< HEAD
    vi.mocked(useRerunnableStatusText).mockReturnValue('Location conflicts')
=======
    vi.mocked(useHardwareStatusText).mockReturnValue('Location conflicts')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
    render(props)
    screen.getByText('Location conflicts')
  })

  it('should render missing chip when missing a module', () => {
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: mockMissingModule,
      isLoading: false,
      conflictedSlots: [],
    })
<<<<<<< HEAD
    vi.mocked(useRerunnableStatusText).mockReturnValue('Missing 1 module')
=======
    vi.mocked(useHardwareStatusText).mockReturnValue('Missing 1 module')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
    render(props)
    screen.getByText('Missing 1 module')
  })

  it('should render missing chip (module and pipette) when missing a pipette and a module', () => {
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: missingBoth,
      isLoading: false,
      conflictedSlots: [],
    })
<<<<<<< HEAD
    vi.mocked(useRerunnableStatusText).mockReturnValue('Missing hardware')
    render(props)
    screen.getByText('Missing hardware')
  })

  it('should render bad protocol chip when the protocol is bad even if hardware matches', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    const propsWithBadRun = { runData: mockBadRunData }
    vi.mocked(useRerunnableStatusText).mockReturnValue(
      'Run could not be loaded'
    )
    render(propsWithBadRun)
    screen.getByText('Run could not be loaded')
=======
    vi.mocked(useHardwareStatusText).mockReturnValue('Missing hardware')
    render(props)
    screen.getByText('Missing hardware')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })

  it('when tapping a card, mock functions is called and loading state is activated', () => {
    render(props)
    const button = screen.getByLabelText('RecentRunProtocolCard')
    expect(button).toHaveStyle(`background-color: ${COLORS.green35}`)
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
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

  it('should push to protocol details if protocol contains runtime parameters', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: simpleAnalysisFileFixture,
    } as any)
    render(props)
    const button = screen.getByLabelText('RecentRunProtocolCard')
    fireEvent.click(button)
    expect(mockPush).toBeCalledWith('/protocols/mockProtocolId')
  })
})
