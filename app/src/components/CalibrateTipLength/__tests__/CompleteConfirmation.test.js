// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import {
  mockTipLengthCalBlock,
  mockTipLengthTipRack,
} from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { CompleteConfirmation } from '../CompleteConfirmation'

const SLOT_ONE_ASSET = 'Slot_1_Remove_CalBlock_(330x260)REV1.webm'
const SLOT_THREE_ASSET = 'Slot_3_Remove_CalBlock_(330x260)REV1.webm'

describe('CompleteConfirmation', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="Return tip to tip rack"]')
      .find('button')

  const getVideo = wrapper => wrapper.find('video > source')

  beforeEach(() => {
    render = (
      props: $Shape<React.ElementProps<typeof CompleteConfirmation>> = {}
    ) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockTipLengthTipRack,
        calBlock = mockTipLengthCalBlock,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
      } = props
      return mount(
        <CompleteConfirmation
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          calBlock={calBlock}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue sends exit command and deletes session', () => {
    const wrapper = render()

    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(Sessions.tipCalCommands.EXIT)
    expect(mockDeleteSession).toHaveBeenCalled()
  })

  it('does not render demo if no cal block', () => {
    const wrapper = render({ calBlock: null })

    expect(getVideo(wrapper).exists()).toBe(false)
  })

  it('renders correct demo if cal block in slot one', () => {
    const wrapper = render({
      calBlock: { ...mockTipLengthCalBlock, slot: '1' },
    })

    expect(getVideo(wrapper).prop('src')).toEqual(SLOT_ONE_ASSET)
  })

  it('renders correct demo if cal block in slot three', () => {
    const wrapper = render({
      calBlock: { ...mockTipLengthCalBlock, slot: '3' },
    })

    expect(getVideo(wrapper).prop('src')).toEqual(SLOT_THREE_ASSET)
  })
})
