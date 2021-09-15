import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../../../i18n'
import { CalibrationItem } from '../CalibrationItem'

describe('CalibrationItem', () => {
  const render = ({
    subText = undefined,
    calibratedDate = undefined,
    title = 'stub title',
    button = <button>stub button</button>,
  }: Partial<React.ComponentProps<typeof CalibrationItem>> = {}) => {
    return renderWithProviders(
      <CalibrationItem {...{ subText, calibratedDate, title, button }} />,
      { i18nInstance: i18n }
    )
  }

  it('renders all nodes with prop contents', () => {
    const { getByRole, getByText } = render({ subText: 'stub subtext' })
    expect(getByText('stub title')).toBeTruthy()
    expect(getByText('stub subtext')).toBeTruthy()
    expect(getByRole('button', { name: 'stub button' })).toBeTruthy()
  })
  it('renders calibrated date if there is no subtext', () => {
    const { getByText } = render({
      calibratedDate: 'Thursday, September 9, 2021',
    })
    expect(getByText('Last calibrated: September 09, 2021 00:00')).toBeTruthy()
  })
  it('renders not calibrated if there is no subtext or cal date', () => {
    const { getByText } = render()
    expect(getByText('Not calibrated yet')).toBeTruthy()
  })
})
