import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { when } from 'vitest-when'
import { MemoryRouter } from 'react-router-dom'
import { useDeleteRunMutation } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import runRecord from '../../../organisms/RunDetails/__fixtures__/runRecord.json'
import { useDownloadRunLog, useTrackProtocolRunEvent, useRobot } from '../hooks'
import { useRunControls } from '../../RunTimeControl/hooks'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../redux/analytics'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { getRobotUpdateDisplayInfo } from '../../../redux/robot-update'
import { useIsEstopNotDisengaged } from '../../../resources/devices/hooks/useIsEstopNotDisengaged'
import { HistoricalProtocolRunOverflowMenu } from '../HistoricalProtocolRunOverflowMenu'
import { useNotifyAllCommandsQuery } from '../../../resources/runs'

import type { UseQueryResult } from 'react-query'
import type { CommandsData } from '@opentrons/api-client'

vi.mock('../../../redux/analytics')
vi.mock('../../../redux/robot-update/selectors')
vi.mock('../../Devices/hooks')
vi.mock('../../RunTimeControl/hooks')
vi.mock('../../../redux/analytics')
vi.mock('../../../redux/config')
vi.mock('../../../resources/devices/hooks/useIsEstopNotDisengaged')
vi.mock('../../../resources/runs')
vi.mock('@opentrons/react-api-client')

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
const ROBOT_NAME = 'otie'
let mockTrackEvent: any
let mockTrackProtocolRunEvent: any
const mockDownloadRunLog = vi.fn()

describe('HistoricalProtocolRunOverflowMenu', () => {
  let props: React.ComponentProps<typeof HistoricalProtocolRunOverflowMenu>
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    mockTrackProtocolRunEvent = vi.fn(() => new Promise(resolve => resolve({})))
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    vi.mocked(useDownloadRunLog).mockReturnValue({
      downloadRunLog: mockDownloadRunLog,
      isRunLogLoading: false,
    })
    vi.mocked(useDeleteRunMutation).mockReturnValue({
      deleteRun: vi.fn(),
    } as any)

    when(useTrackProtocolRunEvent).calledWith(RUN_ID, ROBOT_NAME).thenReturn({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
    when(useRunControls)
      .calledWith(RUN_ID, expect.anything())
      .thenReturn({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        resumeFromRecovery: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
        isResumeRunFromRecoveryActionLoading: false,
      })
    when(useNotifyAllCommandsQuery)
      .calledWith(
        RUN_ID,
        {
          cursor: 0,
          pageLength: PAGE_LENGTH,
        },
        { staleTime: Infinity }
      )
      .thenReturn(({
        data: { data: runRecord.data.commands, meta: { totalLength: 14 } },
      } as unknown) as UseQueryResult<CommandsData>)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
    props = {
      runId: RUN_ID,
      robotName: ROBOT_NAME,
      robotIsBusy: false,
    }
    when(vi.mocked(useRobot))
      .calledWith(ROBOT_NAME)
      .thenReturn(mockConnectableRobot)
  })

  it('renders the correct menu when a runId is present', () => {
    render(props)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    screen.getByRole('button', {
      name: 'View protocol run record',
    })
    const rerunBtn = screen.getByRole('button', { name: 'Rerun protocol now' })
    screen.getByRole('button', { name: 'Download protocol run log' })
    const deleteBtn = screen.getByRole('button', {
      name: 'Delete protocol run record',
    })
    fireEvent.click(rerunBtn)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: {
        robotSerialNumber: 'mock-serial',
        sourceLocation: 'HistoricalProtocolRun',
      },
    })
    expect(useRunControls).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
    fireEvent.click(deleteBtn)
    expect(useDeleteRunMutation).toHaveBeenCalled()
  })

  it('disables the rerun protocol menu item if robot software update is available', () => {
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    render(props)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    screen.getByRole('button', {
      name: 'View protocol run record',
    })
    const rerunBtn = screen.getByRole('button', { name: 'Rerun protocol now' })
    expect(rerunBtn).toBeDisabled()
  })

  it('should make overflow menu disabled when e-stop is pressed', () => {
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(true)
    render(props)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
