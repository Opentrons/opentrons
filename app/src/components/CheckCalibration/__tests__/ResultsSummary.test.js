// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import omit from 'lodash/omit'
import * as Calibration from '../../../calibration'
import { mockCalibrationStatus } from '../../../calibration/__fixtures__'
import * as Fixtures from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import type { State } from '../../../types'
import { ResultsSummary } from '../ResultsSummary'
import { saveAs } from 'file-saver'

import type {
  RobotCalibrationCheckInstrumentsByMount,
  RobotCalibrationCheckComparisonsByStep,
} from '../../../sessions/types'

jest.mock('file-saver')
jest.mock('../../../calibration/selectors')

const mockSaveAs: JestMockFn<
  [Blob, string],
  $Call<typeof saveAs, Blob, string>
> = saveAs

const mockGetCalibrationStatus: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getCalibrationStatus, State, string>
> = Calibration.getCalibrationStatus

const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails

describe('ResultsSummary', () => {
  let render
  let mockStore
  let dispatch

  const mockDeleteSession = jest.fn()

  const getExitButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="Drop tip in trash and exit"]')
      .find('button')

  const getSaveButton = wrapper =>
    wrapper
      .find('OutlineButton[children="Download JSON summary"]')
      .find('button')

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    mockGetCalibrationStatus.mockReturnValue(mockCalibrationStatus)
    render = ({
      instrumentsByMount = mockSessionDetails.instruments,
      comparisonsByStep = mockSessionDetails.comparisonsByStep,
    }: {
      instrumentsByMount?: RobotCalibrationCheckInstrumentsByMount,
      comparisonsByStep?: RobotCalibrationCheckComparisonsByStep,
    } = {}) => {
      return mount(
        <ResultsSummary
          robotName="robot-name"
          instrumentsByMount={instrumentsByMount}
          comparisonsByStep={comparisonsByStep}
          deleteSession={mockDeleteSession}
        />,
        {
          wrappingComponent: Provider,
          wrappingComponentProps: { store: mockStore },
        }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('summarizes both pipettes if comparisons have been made', () => {
    const wrapper = render()

    expect(
      wrapper
        .find('PipetteComparisons')
        .at(0)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('right'))
    expect(
      wrapper
        .find('PipetteComparisons')
        .at(1)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('left'))
  })

  it('summarizes both pipettes if no comparisons have been made', () => {
    const wrapper = render({
      comparisonsByStep: omit(
        mockSessionDetails.comparisonsByStep,
        Sessions.SECOND_PIPETTE_COMPARISON_STEPS
      ),
    })

    expect(
      wrapper
        .find('PipetteComparisons')
        .at(0)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('right'))
    expect(
      wrapper
        .find('PipetteComparisons')
        .at(1)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('left'))
  })

  it('does not summarize second pipette if none present', () => {
    const wrapper = render({
      instrumentsByMount: omit(mockSessionDetails.instruments, 'left'),
    })

    expect(
      wrapper
        .find('PipetteComparisons')
        .at(0)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('right'))
    expect(
      wrapper
        .find('PipetteComparisons')
        .at(1)
        .exists()
    ).toBe(false)
  })

  it('exits when button is clicked', () => {
    const wrapper = render()

    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockDeleteSession).toHaveBeenCalled()
  })

  it('saves the calibration report when the button is clicked', () => {
    const wrapper = render()
    act(() => getSaveButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockSaveAs).toHaveBeenCalled()
  })
})
