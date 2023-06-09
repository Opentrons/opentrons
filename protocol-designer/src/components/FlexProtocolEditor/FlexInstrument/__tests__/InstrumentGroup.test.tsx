import * as React from 'react'
import { shallow } from 'enzyme'
import { InstrumentGroup, InstrumentGroupProps } from '../InstrumentGroup'

describe('InstrumentGroup', () => {
  describe('Positive Test Cases', () => {
    it('renders without crashing', () => {
      const props: InstrumentGroupProps = {
        left: {
          mount: 'left',
          description: 'Flex 96-Channel 1000 μL',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
        right: {
          mount: 'right',
          description: 'P10 Single-Channel',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
      }
      const wrapper = shallow(<InstrumentGroup {...props} />)
      expect(wrapper.exists()).toBe(true)
    })

    it('renders with only left instrument', () => {
      const props: InstrumentGroupProps = {
        left: {
          mount: 'left',
          description: 'P10 Single-Channel',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
      }
      const wrapper = shallow(<InstrumentGroup {...props} />)
      expect(wrapper.exists()).toBe(true)
    })

    it('renders with only right instrument', () => {
      const props: InstrumentGroupProps = {
        right: {
          mount: 'right',
          description: 'P10 Single-Channel',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
      }
      const wrapper = shallow(<InstrumentGroup {...props} />)
      expect(wrapper.exists()).toBe(true)
    })

    it('renders with no instruments', () => {
      const props: InstrumentGroupProps = {}
      const wrapper = shallow(<InstrumentGroup {...props} />)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Edge Test Cases', () => {
    it('renders with long description', () => {
      const props: InstrumentGroupProps = {
        left: {
          mount: 'left',
          description:
            'This is a very long description that will exceed the available width of the container and should be truncated with ellipsis.',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
        right: {
          mount: 'right',
          description:
            'This is a very long description that will exceed the available width of the container and should be truncated with ellipsis.',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
      }
      const wrapper = shallow(<InstrumentGroup {...props} />)
      expect(wrapper.exists()).toBe(true)
    })

    it('renders with only left instrument and long description', () => {
      const props: InstrumentGroupProps = {
        left: {
          mount: 'left',
          description:
            'This is a very long description that will exceed the available width of the container and should be truncated with ellipsis.',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
      }
      const wrapper = shallow(<InstrumentGroup {...props} />)
      expect(wrapper.exists()).toBe(true)
    })

    it('renders with only right instrument and long description', () => {
      const props: InstrumentGroupProps = {
        right: {
          mount: 'right',
          description:
            'This is a very long description that will exceed the available width of the container and should be truncated with ellipsis.',
          name: 'P10 Single-Channel',
          tiprackDefURI: 'tiprack/standard.json',
          isDisabled: false,
        },
      }
      const wrapper = shallow(<InstrumentGroup {...props} />)
      expect(wrapper.exists()).toBe(true)
    })
  })
})
