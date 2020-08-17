// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Sessions from '../../../sessions'
import * as Config from '../../../config'

import { DeckCalibrationControl } from '../DeckCalibrationControl'
import { DeckCalibrationWarning } from '../DeckCalibrationWarning'
import type { State } from '../../../types'

jest.mock('../../../robot-api/selectors')
jest.mock('../../../config/selectors')
jest.mock('../../../sessions/selectors')

const getFeatureFlags: JestMockFn<
  [State],
  $Call<typeof Config.getFeatureFlags, State>
> = Config.getFeatureFlags

describe('ControlsCard', () => {
  let mockStore
  let render

  const getDeckCalButton = wrapper =>
    wrapper.find('TitledControl[title="Calibrate deck"]').find('button')

  beforeEach(() => {
    jest.useFakeTimers()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    getFeatureFlags.mockReturnValue({})

    render = (props = {}) => {
      const {
        robotName = 'robot-name',
        buttonDisabled = false,
        deckCalStatus = 'OK',
        startLegacyDeckCalibration = () => {},
      } = props
      return mount(
        <DeckCalibrationControl
          robotName={robotName}
          buttonDisabled={buttonDisabled}
          deckCalStatus={deckCalStatus}
          startLegacyDeckCalibration={startLegacyDeckCalibration}
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

  it('button launches legacy deck calibration if feature flag for calibration overhaul is falsy', () => {
    const wrapper = render()
    getDeckCalButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).not.toHaveBeenCalledWith(
      Sessions.ensureSession(
        'robot-name',
        Sessions.SESSION_TYPE_DECK_CALIBRATION
      )
    )
  })

  it('button launches new deck calibration button if feature flag for calibration overhaul is truthy', () => {
    getFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: true })
    const wrapper = render()
    getDeckCalButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        'robot-name',
        Sessions.SESSION_TYPE_DECK_CALIBRATION
      ),
      meta: expect.objectContaining({ requestId: expect.any(String) }),
    })
  })

  it('DeckCalibrationWarning component renders if deck calibration is bad', () => {
    const wrapper = render({ deckCalStatus: 'BAD_CALIBRATION' })

    // check that the deck calibration warning component is not null
    // TODO(lc, 2020-06-18): Mock out the new transform status such that
    // this should evaluate to true.
    expect(wrapper.exists(DeckCalibrationWarning)).toBe(true)
  })
})
