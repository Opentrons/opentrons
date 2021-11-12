import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  useRunCompleteTime,
  useRunControls,
  useRunStartTime,
  useRunStatus,
} from '../hooks'
import { Timer } from '../Timer'
import { RunTimeControl } from '..'

jest.mock('../hooks')
jest.mock('../Timer')

const mockUseRunCompleteTime = useRunCompleteTime as jest.MockedFunction<
  typeof useRunCompleteTime
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseRunStartTime = useRunStartTime as jest.MockedFunction<
  typeof useRunStartTime
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockTimer = Timer as jest.MockedFunction<typeof Timer>

const render = () => {
  return renderWithProviders(<RunTimeControl />, { i18nInstance: i18n })
}

describe('RunTimeControl', () => {
  beforeEach(() => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        usePlay: () => {},
        usePause: () => {},
        useReset: () => {},
      })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_IDLE)
    mockTimer.mockReturnValue(<div>Mock Timer</div>)
    when(mockUseRunCompleteTime).calledWith().mockReturnValue(undefined)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('renders a header', () => {
    const [{ getByText }] = render()

    expect(getByText('Run Protocol')).toBeTruthy()
  })

  it('renders a run status but no timer if idle', () => {
    const [{ getByRole, getByText, queryByText }] = render()

    expect(getByText('Status: Not started')).toBeTruthy()
    expect(queryByText('Mock Timer')).toBeNull()
    expect(getByRole('button', { name: 'Start Run' })).toBeTruthy()
  })

  it('renders a run status and timer if running', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_RUNNING)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Running')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Pause Run' })).toBeTruthy()
  })

  it('renders a run status and timer if paused', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_PAUSED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Paused')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Resume Run' })).toBeTruthy()
  })

  it('renders a run status and timer if stopped', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_STOPPED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')
    when(mockUseRunCompleteTime).calledWith().mockReturnValue('noon thirty')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Canceled')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })

  it('renders a run status and timer if failed', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_FAILED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')
    when(mockUseRunCompleteTime).calledWith().mockReturnValue('noon thirty')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Completed')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })

  it('renders a run status and timer if succeeded', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_SUCCEEDED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')
    when(mockUseRunCompleteTime).calledWith().mockReturnValue('noon thirty')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Completed')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })
})
