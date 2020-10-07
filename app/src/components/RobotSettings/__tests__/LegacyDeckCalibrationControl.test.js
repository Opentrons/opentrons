// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Sessions from '../../../sessions'

import { LegacyDeckCalibrationControl } from '../LegacyDeckCalibrationControl'
import { LegacyDeckCalibrationWarning } from '../LegacyDeckCalibrationWarning'
import { DeckCalibrationDownload } from '../DeckCalibrationDownload'

describe('LegacyDeckCalibrationControl', () => {
  let mockStore
  let render

  const getDeckCalButton = wrapper =>
    wrapper
      .find('TitledControl[title="Calibrate deck"]')
      .find('button')
      .filter({ children: 'Calibrate' })

  beforeEach(() => {
    jest.useFakeTimers()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    render = (props = {}) => {
      const {
        robotName = 'robot-name',
        buttonDisabled = false,
        deckCalStatus = 'OK',
        deckCalData = {
          type: 'affine',
          matrix: [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
          ],
          lastModified: null,
          pipetteCalibratedWith: null,
          tiprack: null,
        },
        startLegacyDeckCalibration = () => {},
      } = props
      return mount(
        <LegacyDeckCalibrationControl
          robotName={robotName}
          buttonDisabled={buttonDisabled}
          deckCalStatus={deckCalStatus}
          deckCalData={deckCalData}
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

  it('button launches legacy deck calibration', () => {
    const wrapper = render()
    getDeckCalButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).not.toHaveBeenCalledWith(
      Sessions.ensureSession(
        'robot-name',
        Sessions.SESSION_TYPE_DECK_CALIBRATION
      )
    )
  })

  it('LegacyDeckCalibrationWarning component renders if deck calibration is bad', () => {
    const wrapper = render({ deckCalStatus: 'BAD_CALIBRATION' })

    // check that the deck calibration warning component is not null
    // TODO(lc, 2020-06-18): Mock out the new transform status such that
    // this should evaluate to true.
    expect(wrapper.exists(LegacyDeckCalibrationWarning)).toBe(true)
  })

  it('DeckCalibrationDownload component renders', () => {
    const wrapper = render()

    expect(wrapper.exists(DeckCalibrationDownload)).toBe(true)
  })
})
