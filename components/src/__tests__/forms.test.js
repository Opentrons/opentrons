// form component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {
  CheckboxField,
  InputField,
  RadioGroup
} from '..'

describe('CheckboxField', () => {
  test('renders correctly when unchecked', () => {
    const tree = Renderer.create(
      <CheckboxField
        label='Check Box 1'
        className='foo'
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders correctly when checked', () => {
    const tree = Renderer.create(
      <CheckboxField
        label='Check Box 1'
        className='foo'
        checked
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('InputField', () => {
  test('renders correctly', () => {
    const tree = Renderer.create(
      <InputField
        label='Input field'
        placeholder='Placeholder Text'
        value={null}
        units='μL'
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('RadioGroup', () => {
  test('renders correctly with no checked value', () => {
    const tree = Renderer.create(
      <RadioGroup
        options={[
          {name: 'Hazelnut', value: 'hazelnut'},
          {name: 'Chocolate', value: 'chocolate'},
          {name: 'Ginger', value: 'ginger'}
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders correctly with checked value', () => {
    const tree = Renderer.create(
      <RadioGroup
        checkedValue={'chocolate'}
        options={[
          {name: 'Hazelnut', value: 'hazelnut'},
          {name: 'Chocolate', value: 'chocolate'},
          {name: 'Ginger', value: 'ginger'}
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders correctly inline', () => {
    const tree = Renderer.create(
      <RadioGroup
        checkedValue={'chocolate'}
        options={[
          {name: 'Hazelnut', value: 'hazelnut'},
          {name: 'Chocolate', value: 'chocolate'},
          {name: 'Ginger', value: 'ginger'}
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
