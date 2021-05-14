import * as React from 'react'
import { shallow } from 'enzyme'

import * as Fixtures from '../../../../redux/discovery/__fixtures__'
import { InformationCard } from '../InformationCard'
import { ProtocolPipettesCard } from '../ProtocolPipettesCard'
import { ProtocolModulesCard } from '../ProtocolModulesCard'
import { ProtocolLabwareCard } from '../ProtocolLabwareCard'
import { Continue } from '../Continue'
import { UploadError } from '../../UploadError'
import { FileInfo } from '../'
import type { FileInfoProps } from '../'

describe('File info Component', () => {
  const render = (props: FileInfoProps) => {
    return shallow(<FileInfo {...props} />)
  }

  it('renders all subcomponents when given correct parameters', () => {
    const props = {
      robot: Fixtures.mockConnectedRobot,
      filename: 'fake_file_name',
      sessionLoaded: true,
      sessionHasSteps: true,
      uploadInProgress: false,
      uploadError: null,
      showCustomLabwareWarning: false,
    }
    const wrapper = render(props)
    const labwareCard = wrapper.find(ProtocolLabwareCard)
    expect(wrapper.exists(InformationCard)).toBe(true)
    expect(wrapper.find(ProtocolPipettesCard).exists()).toEqual(true)
    expect(wrapper.find(ProtocolModulesCard).exists()).toEqual(true)
    expect(wrapper.find(Continue).exists()).toEqual(true)
    expect(labwareCard.prop('robotName')).toEqual(
      Fixtures.mockConnectedRobot.name
    )
  })

  it('An error renders when an upload error is given', () => {
    const props = {
      robot: Fixtures.mockConnectedRobot,
      filename: 'fake_file_name',
      sessionLoaded: true,
      sessionHasSteps: true,
      uploadError: { message: 'Oh No!' },
      uploadInProgress: false,
      showCustomLabwareWarning: false,
    }
    const wrapper = render(props)
    const button = wrapper.find(Continue)
    const uploadError = wrapper.find(UploadError)
    // button should not render when upload error occurs
    expect(button.exists()).toEqual(false)
    expect(uploadError.prop('uploadError')).toEqual({ message: 'Oh No!' })
  })
})
