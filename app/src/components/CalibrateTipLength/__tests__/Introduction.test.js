// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import {
  mockTipLengthCalBlock,
  mockTipLengthTipRack,
} from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { Introduction } from '../Introduction'

describe('Introduction', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="Continue to tip length calibration"]')
      .find('button')

  beforeEach(() => {
    render = (props: $Shape<React.ElementProps<typeof Introduction>> = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockTipLengthTipRack,
        calBlock = mockTipLengthCalBlock,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
      } = props
      return mount(
        <Introduction
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

  it('clicking continue proceeds to next step', () => {
    const wrapper = render()

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.tipCalCommands.LOAD_LABWARE
    )
  })
})
