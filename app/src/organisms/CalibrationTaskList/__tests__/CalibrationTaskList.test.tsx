import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { i18n } from '../../../i18n'
import { CalibrationTaskList } from '..'
import {
  mockDeckCalLauncher,
  mockTipLengthCalLauncher,
  mockPipOffsetCalLauncher,
  expectedTaskList,
  expectedIncompleteDeckCalTaskList,
} from '../../Devices/hooks/__fixtures__/taskListFixtures'
import { useCalibrationTaskList } from '../../Devices/hooks'

jest.mock('../../Devices/hooks')

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>

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
  beforeEach(() => {
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
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

  it('shows the Calibrations complete screen after the calibrations are completed', () => {
    // initial render has incomplete calibrations, the rerender will use the completed calibrations mock response
    // this triggers the useEffect that causes the Calibrations complete screen to render
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedIncompleteDeckCalTaskList
    )
    const [{ getByText, rerender }] = render()
    expect(getByText('Calibrate')).toBeTruthy()
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
        />
      </StaticRouter>
    )
    expect(getByText('Calibrations complete!')).toBeTruthy()
  })
})
