// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { getStepItemContents } from '../StepItem'
import { ModuleStepItems } from '../ModuleStepItems'

function renderWrapper(Component) {
  return shallow(<div>{Component}</div>)
}

describe('getStepItemContents', () => {
  test('module component is rendered when substep is magnet', () => {
    const props = {
      substeps: {
        substepType: 'magnet',
        engage: true,
        labwareDisplayName: 'magnet display',
        labwareNickname: 'magnet nickname',
        message: 'message',
      },
      rawForm: {},
    }

    const Component = getStepItemContents(props)
    const wrapper = renderWrapper(Component)

    expect(wrapper.find(ModuleStepItems)).toHaveLength(1)
  })

  test('module component is rendered when substep is temperature', () => {
    const props = {
      substeps: {
        substepType: 'temperature',
        engage: true,
        labwareDisplayName: 'temperature display',
        labwareNickname: 'temperature nickname',
        message: 'message',
      },
      rawForm: {},
    }

    const Component = getStepItemContents(props)
    const wrapper = renderWrapper(Component)

    expect(wrapper.find(ModuleStepItems)).toHaveLength(1)
  })
})
