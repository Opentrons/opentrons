import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useRunControls, useRunStatus } from '../hooks'
import { Timer } from '../Timer'
import { RunTimeControl } from '..'

jest.mock('../hooks')
jest.mock('../Timer')

const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
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
        play: () => {},
        pause: () => {},
        reset: () => {},
      })
    when(mockUseRunStatus).calledWith().mockReturnValue('loaded')
    mockTimer.mockReturnValue(<div>Mock Timer</div>)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('renders a header', () => {
    const [{ getByText }] = render()

    expect(getByText('Run Protocol')).toBeTruthy()
  })

  it('renders a run status but no timer if loaded', () => {
    const [{ getByRole, getByText, queryByText }] = render()

    expect(getByText('Status: Not started')).toBeTruthy()
    expect(queryByText('Mock Timer')).toBeNull()
    expect(getByRole('button', { name: 'Start Run' })).toBeTruthy()
  })

  it('renders a run status and timer if running', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue('running')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Running')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Pause Run' })).toBeTruthy()
  })

  it('renders a run status and timer if paused', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue('paused')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Paused')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Resume Run' })).toBeTruthy()
  })

  it('renders a run status and timer if finished', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue('finished')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Finished')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })

  it('renders a run status and timer if canceled', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue('canceled')
    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Canceled')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })
})
