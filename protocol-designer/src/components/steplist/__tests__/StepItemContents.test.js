// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { THERMOCYCLER_STATE } from '../../../constants'
import { StepItemContents } from '../StepItem'
import { ModuleStepItems } from '../ModuleStepItems'
import type { StepItemContentsProps } from '../StepItem'

describe('StepItemContents', () => {
  let props
  beforeEach(() => {
    props = {
      hoveredSubstep: null,
      ingredNames: {},
      highlightSubstep: jest.fn(),
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
        stepType: stepType,
        substeps: {
          substepType: stepType,
          engage: true,
          labwareDisplayName: 'magnet display',
          labwareNickname: 'magnet nickname',
          message: 'message',
        },
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
    let temperatureProps: StepItemContentsProps
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
      expect(component.prop('actionText')).toEqual('deactivated')
    })
  })

  describe('awaitTemperature step type', () => {
    let awaitTemperatureProps: StepItemContentsProps
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

  describe('thermocyclerState substep type', () => {
    let thermocyclerStateProps: StepItemContentsProps
    const stepType = THERMOCYCLER_STATE

    beforeEach(() => {
      thermocyclerStateProps = {
        ...props,
        rawForm: {
          stepType,
          id: stepType,
          StepFieldName: stepType,
        },
        substeps: null,
        stepType: stepType,
        labwareNicknamesById: {
          temperatureId: 'tc nickname',
        },
        labwareDefDisplayNamesById: {
          temperatureId: 'tc display',
        },
      }
    })

    it('module is rendered with temperature and lid state', () => {
      thermocyclerStateProps.substeps = {
        substepType: stepType,
        blockTargetTemp: 55,
        lidTargetTemp: 45,
        lidOpen: false,
        labwareDisplayName: 'tc display',
        labwareNickname: 'tc nickname',
        message: 'message',
      }
      const wrapper = shallow(<StepItemContents {...thermocyclerStateProps} />)
      const component = wrapper.find(ModuleStepItems)
      expect(component).toHaveLength(1)

      expect(component.prop('labwareDisplayName')).toEqual('tc display')
      expect(component.prop('labwareNickname')).toEqual('tc nickname')
      expect(component.prop('message')).toEqual('message')
      expect(component.prop('action')).toEqual('hold')
      expect(component.prop('actionText')).toEqual('55 °C')
      expect(component.prop('moduleType')).toEqual(THERMOCYCLER_MODULE_TYPE)

      const children = component.children()
      expect(children.length).toEqual(1)
      expect(component.childAt(0).prop('label')).toEqual('Lid (closed)')
      expect(component.childAt(0).prop('value')).toEqual('45 °C')
    })
  })
})
