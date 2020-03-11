// @flow
import * as React from 'react'
import ReactSelect from 'react-select'
import { shallow } from 'enzyme'

import { Select } from '../Select'

describe('Select', () => {
  it('component renders a ReactSelect', () => {
    const wrapper = shallow(<Select options={[]} />)

    expect(wrapper.find(ReactSelect)).toHaveLength(1)
  })

  it('passes props to ReactSelect', () => {
    const options = [{ value: 'foo' }, { value: 'bar' }]
    const value = options[1]
    const name = 'inputName'
    const onChange = jest.fn()
    const onBlur = jest.fn()

    const wrapper = shallow(
      <Select
        options={options}
        value={value}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
      />
    )

    expect(wrapper.find(ReactSelect).props()).toMatchObject({
      options,
      value,
      name,
      onChange,
      onBlur,
    })
  })

  it('merges in className prop', () => {
    const wrapperDefault = shallow(<Select options={[]} />)
    const wrapperWithClass = shallow(
      <Select options={[]} className="something_else" />
    )

    const defaultCx = wrapperDefault.find(ReactSelect).prop('className')
    const withClassCx = wrapperWithClass.find(ReactSelect).prop('className')

    expect(withClassCx).toContain('something_else')
    expect(withClassCx).toContain(defaultCx)
  })
})
