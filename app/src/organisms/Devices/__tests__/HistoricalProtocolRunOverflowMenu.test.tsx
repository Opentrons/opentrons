import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'
import { UseQueryResult } from 'react-query'
import { fireEvent } from '@testing-library/react'
import {
  useAllCommandsQuery,
  useDeleteRunMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import runRecord from '../../../organisms/RunDetails/__fixtures__/runRecord.json'
import { useTrackProtocolRunEvent } from '../hooks'
import { useRunControls } from '../../RunTimeControl/hooks'
import { HistoricalProtocolRunOverflowMenu } from '../HistoricalProtocolRunOverflowMenu'
import { DownloadRunLogToast } from '../DownloadRunLogToast'
import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'

import type { CommandsData } from '@opentrons/api-client'

const mockPush = jest.fn()

jest.mock('../../../redux/buildroot/selectors')
jest.mock('../../Devices/hooks')
jest.mock('../DownloadRunLogToast')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../../redux/analytics')
jest.mock('../../../redux/config')
jest.mock('@opentrons/react-api-client')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseAllCommandsQuery = useAllCommandsQuery as jest.MockedFunction<
  typeof useAllCommandsQuery
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseDeleteRunMutation = useDeleteRunMutation as jest.MockedFunction<
  typeof useDeleteRunMutation
>
const mockDownloadRunLogToast = DownloadRunLogToast as jest.MockedFunction<
  typeof DownloadRunLogToast
>
const mockUseTrackProtocolRunEvent = useTrackProtocolRunEvent as jest.MockedFunction<
  typeof useTrackProtocolRunEvent
>
const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>

const render = (
  props: React.ComponentProps<typeof HistoricalProtocolRunOverflowMenu>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <HistoricalProtocolRunOverflowMenu {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}
const PAGE_LENGTH = 101
const RUN_ID = 'id'
let mockTrackProtocolRunEvent: jest.Mock

describe('HistoricalProtocolRunOverflowMenu', () => {
  let props: React.ComponentProps<typeof HistoricalProtocolRunOverflowMenu>
  beforeEach(() => {
    mockTrackProtocolRunEvent = jest.fn(
      () => new Promise(resolve => resolve({}))
    )
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    when(mockDownloadRunLogToast).mockReturnValue(
      <div>mock downlaod run log toast</div>
    )
    when(
      mockUseDeleteRunMutation.mockReturnValue({
        deleteRun: jest.fn(),
      } as any)
    )
    when(mockUseTrackProtocolRunEvent).calledWith(RUN_ID).mockReturnValue({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
    when(mockUseRunControls)
      .calledWith(RUN_ID, expect.anything())
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseAllCommandsQuery)
      .calledWith(
        RUN_ID,
        {
          cursor: 0,
          pageLength: PAGE_LENGTH,
        },
        { staleTime: Infinity }
      )
      .mockReturnValue(({
        data: { data: runRecord.data.commands, meta: { totalLength: 14 } },
      } as unknown) as UseQueryResult<CommandsData>)
    props = {
      runId: RUN_ID,
      robotName: 'otie',
      robotIsBusy: false,
    }
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('renders the correct menu when a runId is present', () => {
    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)
    getByRole('button', {
      name: 'View protocol run record',
    })
    const rerunBtn = getByRole('button', { name: 'Rerun protocol now' })
    getByRole('button', { name: 'Download run log' })
    const deleteBtn = getByRole('button', {
      name: 'Delete protocol run record',
    })
    fireEvent.click(rerunBtn)
    expect(mockUseRunControls).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
    fireEvent.click(deleteBtn)
    expect(mockUseDeleteRunMutation).toHaveBeenCalled()
  })

  it('disables the rerun protocol menu item if robot software update is available', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const { getByRole } = render(props)
    const btn = getByRole('button')
    fireEvent.click(btn)
    getByRole('button', {
      name: 'View protocol run record',
    })
    const rerunBtn = getByRole('button', { name: 'Rerun protocol now' })
    expect(rerunBtn).toBeDisabled()
  })
})
