// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import * as Calibration from '../../../calibration'
import { mockCalibrationStatus } from '../../../calibration/__fixtures__'
import * as Fixtures from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import type { State } from '../../../types'
import { ResultsSummary } from '../ResultsSummary'
import { saveAs } from 'file-saver'

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
  let mockDeleteSession

  const getExitButton = wrapper =>
    wrapper.find('PrimaryButton[children="Home robot and exit"]').find('button')

  const getSaveButton = wrapper =>
    wrapper
      .find('OutlineButton[children="Download JSON summary"]')
      .find('button')

  beforeEach(() => {
    mockDeleteSession = jest.fn()
    const mockSendCommands = jest.fn()
    mockGetCalibrationStatus.mockReturnValue(mockCalibrationStatus)
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    render = (
      props: $Shape<React.ElementProps<typeof ResultsSummary>> = {}
    ) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = Fixtures.mockDeckCalTipRack,
        calBlock = null,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.CHECK_STEP_RESULTS_SUMMARY,
        sessionType = Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
        comparisonsByPipette = mockSessionDetails.comparisonsByPipette,
        instruments = mockSessionDetails.instruments,
      } = props
      return mount(
        <ResultsSummary
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          calBlock={calBlock}
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          currentStep={currentStep}
          sessionType={sessionType}
          comparisonsByPipette={comparisonsByPipette}
          instruments={instruments}
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
    ).toEqual(expect.stringContaining('left'))
    expect(
      wrapper
        .find('PipetteComparisons')
        .at(1)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('right'))
  })

  it('summarizes both pipettes if no comparisons have been made', () => {
    const emptyComparison = {
      first: {},
      second: {},
    }
    const wrapper = render({
      comparisonsByPipette: emptyComparison,
    })

    expect(
      wrapper
        .find('PipetteComparisons')
        .at(0)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('left'))
    expect(
      wrapper
        .find('PipetteComparisons')
        .at(1)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('right'))
  })

  it('does not summarize second pipette if none present', () => {
    const wrapper = render({
      instruments: [mockSessionDetails.instruments[0]],
    })
    expect(
      wrapper
        .find('PipetteComparisons')
        .at(0)
        .find('h5')
        .text()
    ).toEqual(expect.stringContaining('left'))
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

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })
})
