// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { Introduction } from '../Introduction'

describe('Introduction', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('button[data-test="continueButton"]')

  const getCancelDeckClearButton = wrapper =>
    wrapper.find('OutlineButton[children="cancel"]').find('button')

  const getConfirmDeckClearButton = wrapper =>
    wrapper.find('OutlineButton[children="continue"]').find('button')

  beforeEach(() => {
    render = (props: $Shape<React.ElementProps<typeof Introduction>> = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SESSION_STARTED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <Introduction
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
          currentStep={currentStep}
          sessionType={sessionType}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue launches clear deck warning then confirm proceeds to next step', () => {
    const wrapper = render()

    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(false)
    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(true)

    getConfirmDeckClearButton(wrapper).invoke('onClick')()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.LOAD_LABWARE
    )
  })

  it('clicking continue launches clear deck warning then cancel closes modal', () => {
    const wrapper = render()

    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(false)
    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(true)

    getCancelDeckClearButton(wrapper).invoke('onClick')()

    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(false)
    expect(mockSendCommand).not.toHaveBeenCalledWith(
      Sessions.deckCalCommands.LOAD_LABWARE
    )
  })

  it('pip offset cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('pipette offset calibration')
    expect(allText).toContain('Calibrating pipette offset enables')
    expect(allText).toContain('continue')

    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.text()).toContain(
      'Before continuing to calibrate pipette offset'
    )
  })

  it('deck cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('deck calibration')
    expect(allText).toContain('Deck calibration ensures positional accuracy')
    expect(allText).toContain('continue to calibrate deck')

    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.text()).toContain('Before continuing to calibrate deck')
  })
})
