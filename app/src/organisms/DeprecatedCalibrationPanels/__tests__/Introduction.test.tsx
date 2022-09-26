import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import * as Constants from '../constants'
import { Introduction } from '../Introduction'

import type { ReactWrapper } from 'enzyme'
import type { Mount } from '@opentrons/components'

describe('Introduction', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof Introduction> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof Introduction>>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof Introduction>>
  ) => wrapper.find('button[data-test="continueButton"]')
  const getUseDiffTipRackButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof Introduction>>
  ) => wrapper.find('button[data-test="chooseTipRackButton"]')

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SESSION_STARTED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
        shouldPerformTipLength = false,
        intent = Constants.INTENT_CALIBRATE_PIPETTE_OFFSET,
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
      intent: Constants.INTENT_CALIBRATE_PIPETTE_OFFSET,
      shouldPerformTipLength: false,
      header: 'pipette offset calibration',
      body: /calibrating pipette offset/i,
      note: /using the Opentrons tips/i,
      showTipRackButton: false,
    },
    {
      when: 'doing offset only with recalibrate intent',
      intent: Constants.INTENT_RECALIBRATE_PIPETTE_OFFSET,
      shouldPerformTipLength: false,
      header: 'pipette offset calibration',
      body: /calibrating pipette offset/i,
      note: /using the Opentrons tips/i,
      showTipRackButton: false,
    },
    {
      when: 'doing offset only with tip length in proto intent',
      intent: Constants.INTENT_TIP_LENGTH_IN_PROTOCOL,
      shouldPerformTipLength: false,
      header: 'pipette offset calibration',
      body: /calibrating pipette offset/i,
      note: /using the Opentrons tips/i,
      showTipRackButton: false,
    },
    {
      when: 'doing offset only with tip length outside proto intent',
      intent: Constants.INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      shouldPerformTipLength: false,
      header: 'pipette offset calibration',
      body: /calibrating pipette offset/i,
      note: /using the Opentrons tips/i,
      showTipRackButton: false,
    },
    {
      when: 'doing fused with pipette offset intent',
      intent: Constants.INTENT_CALIBRATE_PIPETTE_OFFSET,
      shouldPerformTipLength: true,
      header: 'tip length and pipette offset calibration',
      body: /calibrating pipette offset.*tip length calibration/i,
      note: /using the Opentrons tips/i,
      showTipRackButton: true,
    },
    {
      when: 'doing fused with recalibrate pipette offset intent',
      intent: Constants.INTENT_RECALIBRATE_PIPETTE_OFFSET,
      shouldPerformTipLength: true,
      header: 'tip length and pipette offset calibration',
      body: /calibrating pipette offset.*tip length calibration/i,
      note: /using the Opentrons tips/i,
      showTipRackButton: true,
    },
    {
      when: 'doing fused with tip length outside proto intent',
      intent: Constants.INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      shouldPerformTipLength: true,
      header: 'tip length and pipette offset calibration',
      body: /calibrating pipette offset.*tip length calibration/i,
      note: /using the Opentrons tips/i,
      showTipRackButton: true,
    },
    {
      when: 'doing fused with tip length in proto intent',
      intent: Constants.INTENT_TIP_LENGTH_IN_PROTOCOL,
      shouldPerformTipLength: true,
      header: 'tip length and pipette offset calibration',
      body: /calibrating pipette offset.*tip length calibration/i,
      note: /using the exact tips/i,
      showTipRackButton: false,
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
      expect(getUseDiffTipRackButton(wrapper).exists()).toBe(
        spec.showTipRackButton
      )

      getContinueButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
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

    expect(getUseDiffTipRackButton(wrapper).exists()).toBe(true)
    getContinueButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
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
      expect(getUseDiffTipRackButton(wrapper).exists()).toBe(false)

      getContinueButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
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
    expect(getUseDiffTipRackButton(wrapper).exists()).toBe(false)
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })
})
