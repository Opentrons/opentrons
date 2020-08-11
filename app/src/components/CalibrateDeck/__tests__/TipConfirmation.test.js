// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { TipConfirmation } from '../TipConfirmation'

describe('TipConfirmation', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getConfirmTipButton = wrapper =>
    wrapper.find('PrimaryButton[children="Yes, continue"]').find('button')

  const getInvalidateTipButton = wrapper =>
    wrapper.find('PrimaryButton[children="No, try again"]').find('button')

  beforeEach(() => {
    render = (
      props: $Shape<React.ElementProps<typeof TipConfirmation>> = {}
    ) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
      } = props
      return mount(
        <TipConfirmation
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm tip attached sends pick up tip command', () => {
    const wrapper = render()

    act(() => getConfirmTipButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.MOVE_TO_POINT_ONE
    )
  })
  it('clicking invalidate tip send invalidate tip command', () => {
    const wrapper = render()

    act(() => getInvalidateTipButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.INVALIDATE_TIP
    )
  })
})
