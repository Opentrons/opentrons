// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import omit from 'lodash/omit'
import * as Fixtures from '../../../calibration/__fixtures__'
import * as Calibration from '../../../calibration'
import type {
  RobotCalibrationCheckInstrumentsByMount,
  RobotCalibrationCheckComparisonsByStep,
} from '../../../calibration'
import { ResultsSummary } from '../ResultsSummary'
import { saveAs } from 'file-saver'

jest.mock('file-saver')

const mockSaveAs: JestMockFn<
  [Blob, string],
  $Call<typeof saveAs, Blob, string>
> = saveAs

const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails

describe('ResultsSummary', () => {
  let render

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
    render = ({
      instrumentsByMount = mockSessionDetails.instruments,
      comparisonsByStep = mockSessionDetails.comparisonsByStep,
    }: {
      instrumentsByMount?: RobotCalibrationCheckInstrumentsByMount,
      comparisonsByStep?: RobotCalibrationCheckComparisonsByStep,
    } = {}) => {
      return mount(
        <ResultsSummary
          instrumentsByMount={instrumentsByMount}
          comparisonsByStep={comparisonsByStep}
          deleteSession={mockDeleteSession}
        />
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
        Calibration.SECOND_PIPETTE_COMPARISON_STEPS
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

  it('does not show troubleshooting intstructions if no failures', () => {
    const wrapper = render()

    expect(wrapper.find('TroubleshootingInstructions').exists()).toBe(false)
  })

  it('does show troubleshooting intstructions at least one failed check', () => {
    const wrapper = render({
      comparisonsByStep: {
        ...mockSessionDetails.comparisonsByStep,
        [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE]:
          Fixtures.badXYComparison,
      },
    })

    expect(wrapper.find('TroubleshootingInstructions').exists()).toBe(true)
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
