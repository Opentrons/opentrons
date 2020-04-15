// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { StepItemContents } from '../StepItem'
import { ModuleStepItems } from '../ModuleStepItems'

import type { StepItemProps } from '../StepItem'

describe('StepItemContents', () => {
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

    it('module rendered with engage when engage is true', () => {
      const wrapper = shallow(<StepItemContents {...magnetProps} />)
      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('engage')
    })

    it('module rendered with disengage when type is disengage', () => {
      magnetProps.substeps.engage = false
      const wrapper = shallow(<StepItemContents {...magnetProps} />)
      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('disengage')
    })
  })

  describe('temperature step type', () => {
    let temperatureProps: StepItemProps
    const stepType: 'temperature' = 'temperature'

    beforeEach(() => {
      temperatureProps = {
        ...props,
        rawForm: {
          stepType,
          id: stepType,
          StepFieldName: stepType,
        },
        substeps: null,
        stepType: stepType,
        labwareNicknamesById: {
          temperatureId: 'temperature nickname',
        },
        labwareDefDisplayNamesById: {
          temperatureId: 'temperature display',
        },
      }
    })

    it('module is rendered with temperature when temperature exists', () => {
      temperatureProps.substeps = {
        substepType: stepType,
        temperature: 45,
        labwareDisplayName: 'temperature display',
        labwareNickname: 'temperature nickname',
        message: 'message',
      }
      const wrapper = shallow(<StepItemContents {...temperatureProps} />)
      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('45 °C')
    })

    it('module is rendered with deactivated when temperature is null', () => {
      temperatureProps.substeps = {
        substepType: stepType,
        temperature: null,
        labwareDisplayName: 'temperature display',
        labwareNickname: 'temperature nickname',
        message: 'message',
      }
      const wrapper = shallow(<StepItemContents {...temperatureProps} />)
      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('actionText')).toEqual('Deactivated')
    })
  })

  describe('awaitTemperature step type', () => {
    let awaitTemperatureProps: StepItemProps
    const stepType: 'awaitTemperature' = 'awaitTemperature'

    beforeEach(() => {
      awaitTemperatureProps = {
        ...props,
        rawForm: {
          stepType,
          id: stepType,
          StepFieldName: stepType,
        },
        substeps: null,
        stepType: stepType,
        labwareNicknamesById: {
          temperatureId: 'temperature nickname',
        },
        labwareDefDisplayNamesById: {
          temperatureId: 'temperature display',
        },
      }
    })

    it('module is rendered with temperature', () => {
      awaitTemperatureProps.substeps = {
        substepType: stepType,
        temperature: 45,
        labwareDisplayName: 'temperature display',
        labwareNickname: 'temperature nickname',
        message: 'message',
      }
      const wrapper = shallow(<StepItemContents {...awaitTemperatureProps} />)
      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)
      expect(component.prop('action')).toEqual('pause until')
      expect(component.prop('actionText')).toEqual('45 °C')
    })
  })
})
