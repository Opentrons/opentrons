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

  it('does not show the Calibrations complete screen when viewing a completed task list', () => {
    const [{ queryByText }] = render()
    expect(queryByText('Calibrations complete!')).toBeFalsy()
  })
})
