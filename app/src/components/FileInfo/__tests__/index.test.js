// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as Fixtures from '../../../discovery/__fixtures__'
import { InformationCard } from '../InformationCard'
import { ProtocolPipettesCard } from '../ProtocolPipettesCard'
import { ProtocolModulesCard } from '../ProtocolModulesCard'
import { ProtocolLabwareCard } from '../ProtocolLabwareCard'
import { Continue } from '../Continue'
import { FileInfo } from '../'
import type { FileInfoProps } from '../'
import { UploadError } from '../../UploadError'

import type { State } from '../../../types'

const MOCK_STATE: State = ({ mockState: true }: any)
const MOCK_STORE = {
  getState: () => MOCK_STATE,
  dispatch: noop,
  subscribe: noop,
}

describe('File info Component', () => {
  const render = (props: FileInfoProps) => {
    return mount(
      <Provider store={MOCK_STORE}>
        <FileInfo {...props} />
      </Provider>
    )
  }

  it('renders all subcomponents when given correct parameters', () => {
    const props = {
      robot: Fixtures.mockConnectedRobot,
      sessionLoaded: true,
      sessionHasSteps: true,
      uploadError: null,
    }
    const wrapper = render(props)
    const labwareCard = wrapper.find(ProtocolLabwareCard)
    expect(wrapper.find(InformationCard).exists()).toEqual(true)
    expect(wrapper.find(ProtocolPipettesCard).exists()).toEqual(true)
    expect(wrapper.find(ProtocolModulesCard).exists()).toEqual(true)
    expect(wrapper.find(Continue).exists()).toEqual(true)
    expect(labwareCard.props().robotName).toEqual(true)
  })

  it('An error renders when an upload error is given', () => {
    const props = {
      robot: Fixtures.mockConnectedRobot,
      sessionLoaded: true,
      sessionHasSteps: true,
      uploadError: { message: 'Oh No!' },
    }
    const wrapper = render(props)
    const button = wrapper.find(Continue)
    const uploadError = wrapper.find(UploadError)
    // button should not render when upload error occurs
    expect(button.exists()).toEqual(false)
    expect(uploadError.exists()).toEqual(false)
    expect(uploadError.props().uploadError.message).toEqual('Oh No!')
  })
})
