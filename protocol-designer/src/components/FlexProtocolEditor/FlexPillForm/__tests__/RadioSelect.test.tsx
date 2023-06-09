import * as React from 'react'
import { RadioGroup } from '@opentrons/components'
import { mount } from 'enzyme'
import { Formik } from 'formik'
import { RadioSelect } from '../RadioSelect'

describe('FlexRadioSelectComponent', () => {
  it('renders with correct props', () => {
    const mockPipetteName = 'p300_single_v2.0'
    const mockPipetteType = 'single'
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <RadioSelect
          pipetteName={mockPipetteName}
          pipetteType={mockPipetteType}
        />
      </Formik>
    )
    expect(wrapper.find(RadioGroup).prop('name')).toBe(mockPipetteName)
    expect(wrapper.find(RadioGroup).prop('value')).toBe(mockPipetteType)
    expect(wrapper.find(RadioGroup).prop('options')).toBeDefined()
  })

  it('does not render with incorrect props', () => {
    const mockPipetteName = 'p300_single_v2.0'
    const mockPipetteType = 'single'
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <RadioSelect
          pipetteName={mockPipetteName}
          pipetteType={mockPipetteType}
        />
      </Formik>
    )
    expect(wrapper.find(RadioGroup).prop('name')).not.toBe('p200_single_v2.0')
    expect(wrapper.find(RadioGroup).prop('value')).not.toBe('multi')
    expect(wrapper.find(RadioGroup).prop('options')).toBeDefined()
  })

  it('throws error with missing props', () => {
    expect(() => {
      mount(<RadioSelect />)
    }).toThrow()
  })
})
