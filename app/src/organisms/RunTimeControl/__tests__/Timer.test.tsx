import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useRunStartTime, useRunStatus } from '../hooks'
import { Timer } from '../Timer'

jest.mock('../hooks')

const mockUseRunStartTime = useRunStartTime as jest.MockedFunction<
  typeof useRunStartTime
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>

const render = () => {
  return renderWithProviders(<Timer />, { i18nInstance: i18n })
}

describe('Timer', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders a start time', () => {
    when(mockUseRunStartTime)
      .calledWith()
      .mockReturnValue('2021-10-07T18:44:49.366581+00:00')
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(['loaded', '2021-10-07T18:44:49.366581+00:00'])
    const [{ getByText }] = render()

    expect(
      getByText(
        /^Start Time: (\d{1,2}):(\d{2}):(\d{2}) (A|P)M GMT(\+|-)(\d{2}):(\d{2})$/
      )
    ).toBeTruthy()
  })

  it('renders a run time', () => {
    when(mockUseRunStartTime)
      .calledWith()
      .mockReturnValue('2021-10-07T18:44:49.366581+00:00')
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(['running', '2021-10-07T18:44:49.366581+00:00'])
    const [{ getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText(/^(\d{2}):(\d{2}):(\d{2})$/)).toBeTruthy()
  })

  // renders a paused time when paused
  // renders a run time that doesn't run when paused
})
