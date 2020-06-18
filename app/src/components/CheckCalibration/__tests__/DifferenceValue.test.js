// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import * as Fixtures from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import { DifferenceValue } from '../DifferenceValue'

import type { RobotCalibrationCheckStep } from '../../../sessions/types'

const {
  badZComparison,
  goodZComparison,
  badXYComparison,
  goodXYComparison,
} = Fixtures

describe('DifferenceValue', () => {
  let render

  beforeEach(() => {
    render = ({
      stepName = Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
      differenceVector = goodZComparison.differenceVector,
    }: {
      stepName?: RobotCalibrationCheckStep,
      differenceVector?: [number, number, number],
    } = {}) => {
      return mount(
        <DifferenceValue
          stepName={stepName}
          differenceVector={differenceVector}
        />
      )
    }
  })

  it('renders good Z comparison', () => {
    const wrapper = render()

    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('Z')
    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('+0.1 mm')
  })

  it('renders bad Z comparison', () => {
    const wrapper = render({
      differenceVector: badZComparison.differenceVector,
    })

    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('Z')
    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('+4.0 mm')
  })

  it('renders good X/Y comparison', () => {
    const wrapper = render({
      stepName: Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
      differenceVector: goodXYComparison.differenceVector,
    })

    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('X')
    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('+0.1 mm')
    expect(
      wrapper
        .find('p')
        .at(2)
        .text()
    ).toEqual('Y')
    expect(
      wrapper
        .find('p')
        .at(3)
        .text()
    ).toEqual('+0.1 mm')
  })

  it('renders bad X/Y comparison', () => {
    const wrapper = render({
      stepName: Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
      differenceVector: badXYComparison.differenceVector,
    })

    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('X')
    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('+4.0 mm')
    expect(
      wrapper
        .find('p')
        .at(2)
        .text()
    ).toEqual('Y')
    expect(
      wrapper
        .find('p')
        .at(3)
        .text()
    ).toEqual('+4.0 mm')
  })

  it('renders no sign with zero value', () => {
    const wrapper = render({
      stepName: Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
      differenceVector: [0, 0, 0],
    })

    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('0.0 mm')
  })

  it('renders plus sign with positive value', () => {
    const wrapper = render({
      stepName: Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
      differenceVector: [0, 0, 5.2],
    })

    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('+5.2 mm')
  })

  it('renders minus sign with negative value', () => {
    const wrapper = render({
      stepName: Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
      differenceVector: [0, 0, -3.1],
    })

    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('-3.1 mm')
  })
})
