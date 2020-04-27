// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import * as Calibration from '../../../calibration'
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
  let mockStore
  let render

  const activeInstrumentId = Object.keys(
    mockRobotCalibrationCheckSessionData.instruments
  )[0]

  beforeEach(() => {
    // NOTE: deliberately not testing RobotWorkSpace internals here
    MockRobotWorkSpace.mockReturnValue(null)
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }
    render = () => {
      return mount(
        <DeckSetup
          labware={mockRobotCalibrationCheckSessionData.labware}
          robotName={mockRobot.name}
          activeInstrumentId={activeInstrumentId}
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

  it('clicking continue proceeds to next step', () => {
    const wrapper = render()

    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.preparePipetteRobotCalibrationCheck(
        mockRobot.name,
        activeInstrumentId
      )
    )
  })
})
