// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Sessions from '../../../sessions'

import { DeckCalibrationControl } from '../DeckCalibrationControl'
import { DeckCalibrationWarning } from '../DeckCalibrationWarning'

jest.mock('../../../robot-api/selectors')
jest.mock('../../../sessions/selectors')

describe('DeckCalibrationControl', () => {
  let mockStore
  let render

  const getDeckCalButton = wrapper =>
    wrapper
      .find('TitledControl[title="Calibrate deck"]')
      .find('button')
      .filter({ children: 'Calibrate' })

  const getCancelDeckCalButton = wrapper =>
    wrapper.find('OutlineButton[children="cancel"]').find('button')

  const getConfirmDeckCalButton = wrapper =>
    wrapper.find('OutlineButton[children="continue"]').find('button')

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
        buttonDisabled = null,
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
      } = props
      return mount(
        <DeckCalibrationControl
          robotName={robotName}
          buttonDisabled={buttonDisabled}
          deckCalStatus={deckCalStatus}
          deckCalData={deckCalData}
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

  it('button launches new deck calibration after confirm', () => {
    const wrapper = render()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(false)
    getDeckCalButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(true)

    getConfirmDeckCalButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        'robot-name',
        Sessions.SESSION_TYPE_DECK_CALIBRATION
      ),
      meta: expect.objectContaining({ requestId: expect.any(String) }),
    })
  })

  it('button launches new deck calibration and cancel closes', () => {
    const wrapper = render()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(false)
    getDeckCalButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(true)

    getCancelDeckCalButton(wrapper).invoke('onClick')()

    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(false)
    expect(mockStore.dispatch).not.toHaveBeenCalledWith({
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
