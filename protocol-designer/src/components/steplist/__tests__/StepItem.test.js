// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { getStepItemContents } from '../StepItem'
import { ModuleStepItems } from '../ModuleStepItems'

function renderWrapper(Component) {
  return shallow(<div>{Component}</div>)
}

describe('getStepItemContents', () => {
  let props
  beforeEach(() => {
    props = {
      stepId: 'stepId',
      stepNumber: 1,
      title: 'test',
      description: null,
      hoveredSubstep: null,
      ingredNames: {},
      highlightSubstep: jest.fn(),
      selectStep: jest.fn(),
      toggleStepCollapsed: jest.fn(),
      highlightStep: jest.fn(),
    }
  })

  describe('magnet step type', () => {
    let magnetProps
    beforeEach(() => {
      const stepType = 'magnet'
      magnetProps = {
        ...props,
        rawForm: {
          stepType,
          id: stepType,
          StepFieldName: stepType,
        },
        substeps: {
          substepType: stepType,
          engage: true,
          labwareDisplayName: 'magnet display',
          labwareNickname: 'magnet nickname',
          message: 'message',
        },
        stepType: stepType,
        labwareNicknamesById: {
          magnetId: 'magnet nickname',
        },
        labwareDefDisplayNamesById: {
          magnetId: 'magnet display',
        },
      }
    })

    test('module rendered with engage when engage is true', () => {
      const StepItemContents = getStepItemContents(magnetProps)
      const wrapper = renderWrapper(StepItemContents)

      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('engage')
    })

    test('module rendered with disengage when type is disengage', () => {
      magnetProps.substeps.engage = false

      const StepItemContents = getStepItemContents(magnetProps)
      const wrapper = renderWrapper(StepItemContents)

      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('disengage')
    })
  })

  describe('temperature step type', () => {
    let temperatureProps
    beforeEach(() => {
      const stepType = 'temperature'
      temperatureProps = {
        ...props,
        rawForm: {
          stepType,
          id: stepType,
          StepFieldName: stepType,
        },
        substeps: {
          substepType: stepType,
          temperature: 45,
          labwareDisplayName: 'temperature display',
          labwareNickname: 'temperature nickname',
          message: 'message',
        },
        stepType: stepType,
        labwareNicknamesById: {
          magnetId: 'temperature nickname',
        },
        labwareDefDisplayNamesById: {
          magnetId: 'temperature display',
        },
      }
    })

    test('module is rendered with temperature when temperature exists', () => {
      const Component = getStepItemContents(temperatureProps)
      const wrapper = renderWrapper(Component)

      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('45 °C')
    })

    test('module is rendered with deactivated when temperature is null', () => {
      // overwrite temperature like this due to flow issue when temperature changes from num to null
      temperatureProps.substeps = {
        ...temperatureProps.substeps,
        temperature: null,
      }

      const Component = getStepItemContents(temperatureProps)
      const wrapper = renderWrapper(Component)

      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('Deactivated')
    })
  })
})
