import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { MemoryRouter } from 'react-router-dom'
import { i18n } from '../../../i18n'
import { CalibrationStatusBanner } from '../CalibrationStatusBanner'
import { useCalibrationTaskList } from '../hooks'

jest.mock('../hooks')

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>

const render = (
  props: React.ComponentProps<typeof CalibrationStatusBanner>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <CalibrationStatusBanner {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('CalibrationStatusBanner', () => {
  let props: React.ComponentProps<typeof CalibrationStatusBanner>
  beforeEach(() => {
    props = { robotName: 'otie' }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should render null if status is complete', () => {
    mockUseCalibrationTaskList.mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'complete',
      isLoading: false,
    })
    const { queryByText, queryByRole } = render(props)
    expect(queryByText('Recalibration recommended')).toBeNull()
    expect(queryByText('Robot is missing calibration data')).toBeNull()
    expect(queryByRole('link', { name: 'Go to calibration' })).toBeNull()
  })
  it('should render null if loading', () => {
    mockUseCalibrationTaskList.mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'complete',
      isLoading: true,
    })
    const { queryByText, queryByRole } = render(props)
    expect(queryByText('Recalibration recommended')).toBeNull()
    expect(queryByText('Robot is missing calibration data')).toBeNull()
    expect(queryByRole('link', { name: 'Go to calibration' })).toBeNull()
  })
  it('should render recalibration recommended if status bad', () => {
    mockUseCalibrationTaskList.mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'bad',
      isLoading: false,
    })
    const { getByText, queryByText, getByRole } = render(props)
    expect(getByText('Recalibration recommended')).toBeInTheDocument()
    expect(queryByText('Robot is missing calibration data')).toBeNull()
    expect(getByRole('link', { name: 'Go to calibration' })).toBeInTheDocument()
  })
  it('should render calibration required if status bad', () => {
    mockUseCalibrationTaskList.mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'incomplete',
      isLoading: false,
    })
    const { getByText, queryByText, getByRole } = render(props)
    expect(getByText('Robot is missing calibration data')).toBeInTheDocument()
    expect(queryByText('Recalibration recommended')).toBeNull()
    expect(getByRole('link', { name: 'Go to calibration' })).toBeInTheDocument()
  })
})
