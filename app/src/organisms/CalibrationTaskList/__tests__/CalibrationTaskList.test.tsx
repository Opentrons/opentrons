import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { i18n } from '../../../i18n'
import { CalibrationTaskList } from '..'
import {
  mockDeckCalLauncher,
  mockTipLengthCalLauncher,
  mockPipOffsetCalLauncher,
  mockCompleteDeckCalibration,
  mockAttachedPipettesResponse,
  mockCompleteTipLengthCalibrations,
  mockCompletePipetteOffsetCalibrations,
} from '../../Devices/hooks/__fixtures__/taskListFixtures'

jest.mock('../../Devices/hooks', () => {
  const actualHooks = jest.requireActual('../../Devices/hooks')
  return {
    ...actualHooks,
    useAttachedPipettes: jest.fn(() => mockAttachedPipettesResponse),
    useDeckCalibrationData: jest.fn(() => mockCompleteDeckCalibration),
    usePipetteOffsetCalibrations: jest.fn(
      () => mockCompletePipetteOffsetCalibrations
    ),
    useTipLengthCalibrations: jest.fn(() => mockCompleteTipLengthCalibrations),
  }
})

const render = (robotName: string = 'otie') => {
  return renderWithProviders(
    <StaticRouter>
      <CalibrationTaskList
        robotName={robotName}
        pipOffsetCalLauncher={mockPipOffsetCalLauncher}
        tipLengthCalLauncher={mockTipLengthCalLauncher}
        deckCalLauncher={mockDeckCalLauncher}
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationTaskList', () => {
  it('renders the Calibration Task List', () => {
    const [{ getByText }] = render()
    getByText('Deck Calibration')
    getByText('Left Mount')
    getByText('Right Mount')
  })

  it('clicking the recalibrate CTAs triggers the calibration launchers', () => {
    const [{ getByText, getAllByText }] = render()
    getByText('Left Mount').click()
    getByText('Right Mount').click()
    const recalibrateButtons = getAllByText('Recalibrate') // [deck, left-tip-length, left-offset, right-tip-length, left-offset]
    expect(recalibrateButtons).toHaveLength(5)

    recalibrateButtons[0].click()
    expect(mockDeckCalLauncher).toHaveBeenCalled()
    recalibrateButtons[1].click()
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
    recalibrateButtons[2].click()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalled()
    recalibrateButtons[3].click()
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
    recalibrateButtons[4].click()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalled()
  })
})
