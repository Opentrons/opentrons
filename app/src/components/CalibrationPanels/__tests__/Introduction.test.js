// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import * as Constants from '../constants'
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
        shouldPerformTipLength = false,
        intent = Constants.INTENT_PIPETTE_OFFSET,
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
          shouldPerformTipLength={shouldPerformTipLength}
          intent={intent}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const PIP_OFFSET_SPECS = [
    {
      when: 'doing offset only with pipette offset intent',
      intent: Constants.INTENT_PIPETTE_OFFSET,
      shouldPerformTipLength: false,
      header: 'pipette offset calibration',
      body: /calibrating pipette offset/i,
      note: /using the Opentrons tips/i,
    },
    {
      when: 'doing offset only with tip length in proto intent',
      intent: Constants.INTENT_TIP_LENGTH_IN_PROTOCOL,
      shouldPerformTipLength: false,
      header: 'pipette offset calibration',
      body: /calibrating pipette offset/i,
      note: /using the Opentrons tips/i,
    },
    {
      when: 'doing offset only with tip length outside proto intent',
      intent: Constants.INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      shouldPerformTipLength: false,
      header: 'pipette offset calibration',
      body: /calibrating pipette offset/i,
      note: /using the Opentrons tips/i,
    },
    {
      when: 'doing fused with pipette offset intent',
      intent: Constants.INTENT_PIPETTE_OFFSET,
      shouldPerformTipLength: true,
      header: 'tip length and pipette offset calibration',
      body: /calibrating pipette offset.*tip length calibration/i,
      note: /using the Opentrons tips/i,
    },
    {
      when: 'doing fused with tip length in proto intent',
      intent: Constants.INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      shouldPerformTipLength: true,
      header: 'tip length and pipette offset calibration',
      body: /calibrating pipette offset.*tip length calibration/i,
      note: /using the Opentrons tips/i,
    },
    {
      when: 'doing fused with tip length in proto intent',
      intent: Constants.INTENT_TIP_LENGTH_IN_PROTOCOL,
      shouldPerformTipLength: true,
      header: 'tip length and pipette offset calibration',
      body: /calibrating pipette offset.*tip length calibration/i,
      note: /using the exact tips/i,
    },
  ]
  PIP_OFFSET_SPECS.forEach(spec => {
    it(`pip offset cal when ${spec.when} shows correct text`, () => {
      const wrapper = render({
        sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        intent: spec.intent,
        shouldPerformTipLength: spec.shouldPerformTipLength,
      })
      const allText = wrapper.text()
      expect(allText).toContain(spec.header)
      expect(allText).toMatch(spec.body)
      expect(allText).toMatch(spec.note)

      getContinueButton(wrapper).invoke('onClick')()
      wrapper.update()
      expect(mockSendCommands).toHaveBeenCalledWith({
        command: Sessions.sharedCalCommands.LOAD_LABWARE,
      })
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

  const TIP_LENGTH_SPECS = [
    {
      when: 'intending to calibrate in protocol',
      intent: Constants.INTENT_TIP_LENGTH_IN_PROTOCOL,
      note: /exact tips/i,
    },
    {
      when: 'intending to calibrate outside protocol',
      intent: Constants.INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      note: /opentrons tips/i,
    },
  ]
  TIP_LENGTH_SPECS.forEach(spec => {
    it(`tip length cal session type shows correct text when ${spec.when}`, () => {
      const wrapper = render({
        sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
        intent: spec.intent,
      })
      const allText = wrapper.text()
      expect(allText).toContain('tip length calibration')
      expect(allText).toContain(
        'Tip length calibration measures the length of the pipette'
      )
      expect(allText).toContain('start tip length calibration')
      expect(allText).toMatch(spec.note)

      getContinueButton(wrapper).invoke('onClick')()
      wrapper.update()
      expect(mockSendCommands).toHaveBeenCalledWith({
        command: Sessions.sharedCalCommands.LOAD_LABWARE,
      })
    })
  })

  it('health cehck session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
      intent: Constants.INTENT_HEALTH_CHECK,
    })
    const allText = wrapper.text()
    expect(allText).toContain('calibration health check')
    expect(allText).toMatch(/diagnoses calibration problems with tip length/i)
    expect(allText).toMatch(/you will manually guide each attached pipette/i)
    expect(allText).toMatch(/you will be prompted to recalibrate/i)
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })
})
