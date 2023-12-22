import * as React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useRunHasStarted } from '../../hooks'
import { formatTimestamp } from '../../utils'
import { SetupCalibrationItem } from '../SetupCalibrationItem'
import { when, resetAllWhenMocks } from 'jest-when'

jest.mock('../../hooks')
jest.mock('../../utils')

const mockFormatTimestamp = formatTimestamp as jest.MockedFunction<
  typeof formatTimestamp
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>

const RUN_ID = '1'

describe('SetupCalibrationItem', () => {
  const render = ({
    subText = undefined,
    calibratedDate = null,
    title = 'stub title',
    button = <button>stub button</button>,
    runId = RUN_ID,
  }: Partial<React.ComponentProps<typeof SetupCalibrationItem>> = {}) => {
    return renderWithProviders(
      <SetupCalibrationItem
        {...{ subText, calibratedDate, title, button, runId }}
      />,
      { i18nInstance: i18n }
    )[0]
  }

  beforeEach(() => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders all nodes with prop contents', () => {
    render({ subText: 'stub subtext' })
    screen.getByText('stub title')
    screen.getByText('stub subtext')
    screen.getByRole('button', { name: 'stub button' })
  })
  it('renders calibrated date if there is no subtext', () => {
    when(mockFormatTimestamp)
      .calledWith('Thursday, September 9, 2021')
      .mockReturnValue('09/09/2021 00:00:00')
    render({
      calibratedDate: 'Thursday, September 9, 2021',
    })
    screen.getByText('Last calibrated: 09/09/2021 00:00:00')
  })
  it('renders not calibrated if there is no subtext or cal date', () => {
    render()
    screen.getByText('Not calibrated yet')
  })
  it('renders calibration data not available if run has started', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)
    render()
    screen.getByText('Calibration data not available once run has started')
  })
})
