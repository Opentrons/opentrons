// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import { getCalibrateLocation, getRunLocation } from '../../../nav'
import { PrimaryButton } from '@opentrons/components'
import { Continue } from '../Continue'

import type { State } from '../../../types'

jest.mock('../../../nav')

const mockGetCalNavigation: JestMockFn<
  [State],
  $Call<typeof getCalibrateLocation, State>
> = getCalibrateLocation

const mockGetRunNavigation: JestMockFn<
  [State],
  $Call<typeof getRunLocation, State>
> = getRunLocation

const mockRunPath = '/path/to/run'
const mockCalPath = '/path/to/cal'

describe('Continue to run or calibration button component', () => {
  let mockStore
  let render

  const CALIBRATE_SELECTOR = {
    id: 'calibrate',
    path: mockCalPath,
    title: 'CALIBRATE',
    iconName: 'ot-calibrate',
    disabledReason: null,
  }

  const RUN_SELECTOR = {
    id: 'run',
    path: mockRunPath,
    title: 'RUN',
    iconName: 'ot-run',
    disabledReason: null,
  }

  beforeEach(() => {
    mockGetCalNavigation.mockReturnValue(CALIBRATE_SELECTOR)
    mockGetRunNavigation.mockReturnValue(RUN_SELECTOR)

    mockStore = {
      subscribe: () => {},
      getState: () => ({ state: true }),
      dispatch: jest.fn(),
    }
    render = (labwareCalibrated: boolean = false) =>
      mount(
        <Provider store={mockStore}>
          <Continue labwareCalibrated={labwareCalibrated} />
        </Provider>
      )
  })

  it('Default button renders to continue to labware when not all labware is calibrated', () => {
    const wrapper = render()
    const button = wrapper.find(PrimaryButton)
    expect(wrapper.children).toEqual('Proceed to Calibrate')
    expect(button.props.path).toEqual(mockCalPath)
  })

  it('renders nothing when calibration is OK', () => {
    const wrapper = render(true)
    const button = wrapper.find(PrimaryButton)
    expect(wrapper.children).toEqual('Proceed to Run')
    expect(button.props.path).toEqual(mockRunPath)
  })
})
