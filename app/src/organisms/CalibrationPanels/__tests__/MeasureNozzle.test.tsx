import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import {
  mockTipLengthCalBlock,
  mockTipLengthTipRack,
} from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { MeasureNozzle } from '../MeasureNozzle'

import type { ReactWrapper } from 'enzyme'
import type { Mount } from '../../../redux/pipettes/types'
import { VectorTuple } from '../../../redux/sessions/types'

describe('MeasureNozzle', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof MeasureNozzle> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof MeasureNozzle>>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof MeasureNozzle>>
  ) =>
    wrapper
      .find('button[children="Save nozzle z-axis and move to pick up tip"]')
      .find('button')

  const getJogButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof MeasureNozzle>>,
    direction: string
  ) => wrapper.find(`button[title="${direction}"]`).find('button')

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockTipLengthTipRack,
        calBlock = mockTipLengthCalBlock,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET,
        sessionType = Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      } = props
      return mount(
        <MeasureNozzle
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          calBlock={calBlock}
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

  it('renders the confirm crash link', () => {
    const wrapper = render()
    expect(wrapper.find('a[children="Start over"]').exists()).toBe(true)
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })

  it('renders the confirm crash modal when invoked', () => {
    const wrapper = render()
    wrapper.find('a[children="Start over"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('ConfirmCrashRecoveryModal').exists()).toBe(true)
  })

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections: Array<'up' | 'down'> = ['up', 'down']
    const jogParamsByDirection: { [dir in 'up' | 'down']: VectorTuple } = {
      up: [0, 0, 0.1],
      down: [0, 0, -0.1],
    }
    jogDirections.forEach(direction => {
      act(() =>
        getJogButton(wrapper, direction).invoke('onClick')?.(
          {} as React.MouseEvent
        )
      )
      wrapper.update()

      expect(mockSendCommands).toHaveBeenCalledWith({
        command: Sessions.sharedCalCommands.JOG,
        data: { vector: jogParamsByDirection[direction] },
      })
    })

    const unavailableJogDirections = ['left', 'right', 'back', 'forward']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })
  it('clicking continue proceeds to next step', () => {
    const wrapper = render()

    act(() =>
      getContinueButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    )
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith(
      { command: Sessions.sharedCalCommands.SAVE_OFFSET },
      { command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK }
    )
  })
})
