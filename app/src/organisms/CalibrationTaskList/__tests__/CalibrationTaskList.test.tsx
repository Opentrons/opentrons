import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CalibrationTaskList } from '..'
import { useCalibrationTaskList } from '../../Devices/hooks'
import { expectedTaskList } from '../../Devices/hooks/__fixtures__/taskListFixtures'
import { StaticRouter } from 'react-router-dom'

jest.mock('../../Devices/hooks')

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <CalibrationTaskList robotName="otie" />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationTaskList', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the Calibration Task List', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
    const [{ getByText }] = render()
    getByText('Deck Calibration')
    getByText('Left Mount')
    getByText('Right Mount')
  })
})
