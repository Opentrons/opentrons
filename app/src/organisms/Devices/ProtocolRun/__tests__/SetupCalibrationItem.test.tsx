import * as React from 'react'
import '../../../LabwarePositionCheck/__tests__/node_modules/@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { formatTimestamp } from '../../utils'
import { SetupCalibrationItem } from '../SetupCalibrationItem'
import { when } from 'jest-when'

jest.mock('../../utils')

const mockFormatTimestamp = formatTimestamp as jest.MockedFunction<
  typeof formatTimestamp
>

describe('SetupCalibrationItem', () => {
  const render = ({
    subText = undefined,
    calibratedDate = null,
    title = 'stub title',
    button = <button>stub button</button>,
  }: Partial<React.ComponentProps<typeof SetupCalibrationItem>> = {}) => {
    return renderWithProviders(
      <SetupCalibrationItem {...{ subText, calibratedDate, title, button }} />,
      { i18nInstance: i18n }
    )[0]
  }

  it('renders all nodes with prop contents', () => {
    const { getByRole, getByText } = render({ subText: 'stub subtext' })
    getByText('stub title')
    getByText('stub subtext')
    getByRole('button', { name: 'stub button' })
  })
  it('renders calibrated date if there is no subtext', () => {
    when(mockFormatTimestamp)
      .calledWith('Thursday, September 9, 2021')
      .mockReturnValue('09/09/2021 00:00:00')
    const { getByText } = render({
      calibratedDate: 'Thursday, September 9, 2021',
    })
    getByText('Last calibrated: 09/09/2021 00:00:00')
  })
  it('renders not calibrated if there is no subtext or cal date', () => {
    const { getByText } = render()
    getByText('Not calibrated yet')
  })
})
