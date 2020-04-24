// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import {
  mockRobotCalibrationCheckSessionData,
  mockRobot,
} from '../../../calibration/__fixtures__'

import { RobotWorkSpace } from '@opentrons/components'
import { DeckSetup } from '../DeckSetup'

jest.mock('../../../getLabware')
jest.mock('@opentrons/components/src/deck/RobotWorkSpace')

const MockRobotWorkSpace: JestMockFn<
  [any],
  $Call<typeof RobotWorkSpace, any>
> = RobotWorkSpace

describe('DeckSetup', () => {
  const mockProceed = jest.fn()

  beforeEach(() => {
    // NOTE: deliberately not testing RobotWorkSpace internals here
    MockRobotWorkSpace.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue proceeds to next step', () => {
    const wrapper = mount(
      <DeckSetup
        labware={mockRobotCalibrationCheckSessionData.labware}
        robotName={mockRobot.name}
        activeInstrumentId={
          Object.keys(mockRobotCalibrationCheckSessionData.instruments)[0]
        }
      />
    )
    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()

    expect(mockProceed).toHaveBeenCalled()
  })
})
