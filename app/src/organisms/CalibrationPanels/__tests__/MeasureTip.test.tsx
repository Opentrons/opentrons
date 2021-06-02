import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import {
  mockTipLengthCalBlock,
  mockTipLengthTipRack,
} from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { MeasureTip } from '../MeasureTip'

import type { Mount } from '../../../redux/pipettes/types'
import type { ReactWrapper } from 'enzyme'
import type { VectorTuple } from '../../../redux/sessions/types'

describe('MeasureTip', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof MeasureTip> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof MeasureTip>>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof MeasureTip>>
  ) => wrapper.find('button[title="saveTipLengthButton"]').find('button')

  const getJogButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof MeasureTip>>,
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
        <MeasureTip
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

    type ZJogDirections = 'up' | 'down'
    const jogDirections: ZJogDirections[] = ['up', 'down']
    const jogParamsByDirection: { [dir in ZJogDirections]: VectorTuple } = {
      up: [0, 0, 0.1],
      down: [0, 0, -0.1],
    }
    jogDirections.forEach((direction: ZJogDirections) => {
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
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
      }
    )
  })
})
