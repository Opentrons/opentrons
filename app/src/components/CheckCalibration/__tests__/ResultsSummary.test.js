// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import omit from 'lodash/omit'
import * as Fixtures from '../../../calibration/__fixtures__'
import * as Calibration from '../../../calibration'
import type { RobotCalibrationCheckComparisonsByStep } from '../../../calibration'
import { ResultsSummary } from '../ResultsSummary'

const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails

describe('ResultsSummary', () => {
  let render

  const mockDeleteSession = jest.fn()

  const getExitButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="Drop tip in trash and exit"]')
      .find('button')

  beforeEach(() => {
    render = ({
      comparisonsByStep = mockSessionDetails.comparisonsByStep,
    }: {
      comparisonsByStep?: RobotCalibrationCheckComparisonsByStep,
    } = {}) => {
      return mount(
        <ResultsSummary
          instrumentsByMount={mockSessionDetails.instruments}
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

  it('exits when button is clicked', () => {
    const wrapper = render()

    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockDeleteSession).toHaveBeenCalled()
  })
})
