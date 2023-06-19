import * as React from 'react'
import { FlexSupportedModuleDiagram } from '../FlexModuleDiagram'
import { shallow } from 'enzyme'

describe('FlexSupportedModuleDiagram', () => {
  describe('Positive Test Cases', () => {
    it('should render the FlexSupportedModuleDiagram component', () => {
      const props = {
        type: 'heaterShakerModuleType',
        model: 'heaterShakerModuleV1',
      }
      const wrapper = shallow(<FlexSupportedModuleDiagram {...props} />)
      expect(wrapper.exists()).toBeTruthy()
    })
  })

  describe('Negative Test Cases', () => {
    it('should throw an error if type is not provided', () => {
      const props = {
        model: 'model1',
      }
      expect(() => shallow(<FlexSupportedModuleDiagram {...props} />)).toThrow()
    })

    it('should throw an error if model is not provided', () => {
      const props = {
        type: 'type1',
      }
      expect(() => shallow(<FlexSupportedModuleDiagram {...props} />)).toThrow()
    })

    it('should throw an error if type is invalid', () => {
      const props = {
        type: 'invalidType',
        model: 'model1',
      }
      expect(() => shallow(<FlexSupportedModuleDiagram {...props} />)).toThrow()
    })

    it('should throw an error if model is invalid', () => {
      const props = {
        type: 'type1',
        model: 'invalidModel',
      }
      expect(() => shallow(<FlexSupportedModuleDiagram {...props} />)).toThrow()
    })
  })
})
