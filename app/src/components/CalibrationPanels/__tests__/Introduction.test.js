// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { Introduction } from '../Introduction'

describe('Introduction', () => {
  let render

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('button[data-test="continueButton"]')

  beforeEach(() => {
    render = (props: $Shape<React.ElementProps<typeof Introduction>> = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SESSION_STARTED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <Introduction
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          currentStep={currentStep}
          sessionType={sessionType}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('pip offset cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('pipette offset calibration')
    expect(allText).toContain('Calibrating pipette offset enables')
    expect(allText).toContain('start pipette offset calibration')

    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.LOAD_LABWARE,
    })
  })

  it('deck cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('deck calibration')
    expect(allText).toContain('Deck calibration ensures positional accuracy')
    expect(allText).toContain('start deck calibration')

    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.LOAD_LABWARE,
    })
  })

  it('tip length cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('tip length calibration')
    expect(allText).toContain(
      'Tip length calibration measures the length of the pipette'
    )
    expect(allText).toContain('start tip length calibration')

    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.LOAD_LABWARE,
    })
  })
})
