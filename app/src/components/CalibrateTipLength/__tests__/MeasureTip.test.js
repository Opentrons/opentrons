// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { mockTipLengthCalibrationSessionDetails } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { MeasureTip } from '../MeasureTip'

describe('MeasureTip', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('PrimaryButton[children="Save the tip length"]').find('button')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  beforeEach(() => {
    render = (props: $Shape<React.ElementProps<typeof MeasureTip>> = {}) => {
      const {
        hasBlock = true,
        instrument = mockTipLengthCalibrationSessionDetails.instrument,
        labware = mockTipLengthCalibrationSessionDetails.labware,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
      } = props
      return mount(
        <MeasureTip
          hasBlock={hasBlock}
          labware={labware}
          instrument={instrument}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections = ['up', 'down']
    const jogParamsByDirection = {
      up: [0, 0, 0.1],
      down: [0, 0, -0.1],
    }
    jogDirections.forEach(direction => {
      act(() => getJogButton(wrapper, direction).invoke('onClick')())
      wrapper.update()

      expect(mockSendCommand).toHaveBeenCalledWith(
        Sessions.tipCalCommands.JOG,
        { vector: jogParamsByDirection[direction] }
      )
    })

    const unavailableJogDirections = ['left', 'right', 'back', 'forward']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })
  it('clicking continue proceeds to next step', () => {
    const wrapper = render()

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.tipCalCommands.SAVE_OFFSET
    )
  })
})
