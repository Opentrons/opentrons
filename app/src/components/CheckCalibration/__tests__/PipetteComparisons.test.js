// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import * as Fixtures from '../../../calibration/__fixtures__'
import type {
  RobotCalibrationCheckComparisonsByStep,
  RobotCalibrationCheckInstrument,
} from '../../../calibration'
import { PipetteComparisons } from '../PipetteComparisons'

const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails

describe('CompleteConfirmation', () => {
  let render

  const getFirstDataRow = wrapper =>
    wrapper
      .find('tbody')
      .find('tr')
      .at(0)

  beforeEach(() => {
    render = ({
      pipette = mockSessionDetails.instruments.right,
      comparisonsByStep = mockSessionDetails.comparisonsByStep,
    }: {
      pipette?: RobotCalibrationCheckInstrument,
      comparisonsByStep?: RobotCalibrationCheckComparisonsByStep,
    } = {}) => {
      return mount(
        <PipetteComparisons
          pipette={pipette}
          comparisonsByStep={comparisonsByStep}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a row for each comparison passed in', () => {
    const wrapper = render()

    expect(wrapper.find('tbody').find('tr').length).toEqual(6)
  })

  it('correctly formats comparison data', () => {
    const wrapper = render()

    expect(
      getFirstDataRow(wrapper)
        .find('td')
        .at(0)
        .text()
    ).toEqual('Slot 5 Z-axis')
    expect(
      getFirstDataRow(wrapper)
        .find('td')
        .at(1)
        .text()
    ).toEqual('pass')
    expect(
      getFirstDataRow(wrapper)
        .find('td')
        .at(2)
        .find('ThresholdValue')
        .exists()
    ).toBe(true)
    expect(
      getFirstDataRow(wrapper)
        .find('td')
        .at(3)
        .find('DifferenceValue')
        .exists()
    ).toBe(true)
  })
})
