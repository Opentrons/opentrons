// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import { SaveZPoint } from '../SaveZPoint'

describe('SaveZPoint', () => {
  let render

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getSaveButton = wrapper => wrapper.find('button[title="save"]')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`button[title="${direction}"]`).find('button')

  const getVideo = wrapper => wrapper.find(`source`)

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_JOGGING_TO_DECK,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <SaveZPoint
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

  it('displays proper asset', () => {
    const assetMap = {
      left: {
        multi: 'SLOT_5_LEFT_MULTI_Z.webm',
        single: 'SLOT_5_LEFT_SINGLE_Z.webm',
      },
      right: {
        multi: 'SLOT_5_RIGHT_MULTI_Z.webm',
        single: 'SLOT_5_RIGHT_SINGLE_Z.webm',
      },
    }

    Object.keys(assetMap).forEach(mountString => {
      Object.keys(assetMap[mountString]).forEach(channelString => {
        const wrapper = render({
          pipMount: mountString,
          isMulti: channelString === 'multi',
        })
        expect(getVideo(wrapper).prop('src')).toEqual(
          assetMap[mountString][channelString]
        )
      })
    })
  })

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections = ['up', 'down']
    const jogVectorByDirection = {
      up: [0, 0, 0.1],
      down: [0, 0, -0.1],
    }
    jogDirections.forEach(direction => {
      getJogButton(wrapper, direction).invoke('onClick')()
      wrapper.update()

      expect(mockSendCommands).toHaveBeenCalledWith({
        command: Sessions.deckCalCommands.JOG,
        data: {
          vector: jogVectorByDirection[direction],
        },
      })
      mockSendCommands.mockClear()
    })

    const unavailableJogDirections = ['left', 'right', 'back', 'forward']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })

  it('allows jogging in xy axis after prompt clicked', () => {
    const wrapper = render()

    const jogDirections = ['left', 'right', 'back', 'forward']
    const jogVectorByDirection = {
      left: [-0.1, 0, 0],
      right: [0.1, 0, 0],
      back: [0, 0.1, 0],
      forward: [0, -0.1, 0],
    }
    jogDirections.forEach(dir => {
      expect(getJogButton(wrapper, dir).exists()).toBe(false)
    })
    wrapper
      .find('button[children="Reveal XY jog controls to move across deck"]')
      .invoke('onClick')({ preventDefault: () => {} })
    jogDirections.forEach(direction => {
      getJogButton(wrapper, direction).invoke('onClick')()

      expect(mockSendCommands).toHaveBeenCalledWith({
        command: Sessions.deckCalCommands.JOG,
        data: {
          vector: jogVectorByDirection[direction],
        },
      })
      mockSendCommands.mockClear()
    })
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })

  it('sends save offset command when primary button is clicked', () => {
    const wrapper = render()

    getSaveButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.deckCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.deckCalCommands.MOVE_TO_POINT_ONE,
      }
    )
  })

  it('pip offset cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('save calibration and move to slot 1')
    expect(allText).toContain('calibrate z-axis in slot 5')
    expect(allText).toContain('calibrate the z offset for this pipette')
  })

  it('deck cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('remember z-axis and move to slot 1')
    expect(allText).toContain('z-axis in slot 5')
    expect(allText).toContain(
      'use this z position for the rest of deck calibration'
    )
  })

  it('health check session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    })
    const allText = wrapper.text()
    expect(allText).toContain('check z-axis')
    expect(allText).toContain('check z-axis in slot 5')
    expect(allText).toContain('to determine how this position compares')
  })

  it('renders the confirm crash link', () => {
    const wrapper = render()
    expect(wrapper.find('a[children="Start over"]').exists()).toBe(true)
  })

  it('renders the confirm crash modal when invoked', () => {
    const wrapper = render()
    wrapper.find('a[children="Start over"]').invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmCrashRecoveryModal').exists()).toBe(true)
  })
})
