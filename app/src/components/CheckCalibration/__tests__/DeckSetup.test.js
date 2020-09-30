// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { mockRobotCalibrationCheckSessionDetails } from '../../../sessions/__fixtures__'

import { DeckSetup } from '../DeckSetup'

jest.mock('../../../getLabware')

jest.mock('@opentrons/components/src/deck/RobotWorkSpace', () => ({
  RobotWorkSpace: () => <></>,
}))

describe('DeckSetup', () => {
  let render

  const mockProceed = jest.fn()

  beforeEach(() => {
    render = () => {
      return mount(
        <DeckSetup
          labware={mockRobotCalibrationCheckSessionDetails.labware}
          proceed={mockProceed}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue proceeds to next step', () => {
    const wrapper = render()

    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()

    expect(mockProceed).toHaveBeenCalled()
  })
})
