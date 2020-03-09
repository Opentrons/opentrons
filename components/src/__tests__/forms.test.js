// form component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {
  CheckboxField,
  DropdownField,
  FormGroup,
  InputField,
  RadioGroup,
} from '..'

describe('CheckboxField', () => {
  it('renders correctly when unchecked', () => {
    const tree = Renderer.create(
      <CheckboxField label="Check Box 1" className="foo" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when checked', () => {
    const tree = Renderer.create(
      <CheckboxField label="Check Box 1" className="foo" value />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('DropdownField', () => {
  it('renders correctly with a value', () => {
    const tree = Renderer.create(
      <DropdownField
        className="foo"
        value={'rna'}
        options={[
          { name: 'DNA', value: 'dna' },
          { name: 'RNA', value: 'rna' },
          { name: 'Protein', value: 'protein' },
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with a falsey value', () => {
    const tree = Renderer.create(
      <DropdownField
        className="foo"
        value={false}
        options={[
          { name: 'DNA', value: 'dna' },
          { name: 'RNA', value: 'rna' },
          { name: 'Protein', value: 'protein' },
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('FormGroup', () => {
  it('renders correctly', () => {
    const tree = Renderer.create(
      <FormGroup className="foo" label="This is the label">
        <div>Hey test here</div>
        <div>More test here</div>
      </FormGroup>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('InputField', () => {
  it('renders correctly', () => {
    const tree = Renderer.create(
      <InputField
        label="Input field"
        placeholder="Placeholder Text"
        value={null}
        units="μL"
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('RadioGroup', () => {
  it('renders correctly with no checked value', () => {
    const tree = Renderer.create(
      <RadioGroup
        options={[
          { name: 'Hazelnut', value: 'hazelnut' },
          { name: 'Chocolate', value: 'chocolate' },
          { name: 'Ginger', value: 'ginger' },
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with checked value', () => {
    const tree = Renderer.create(
      <RadioGroup
        value="chocolate"
        options={[
          { name: 'Hazelnut', value: 'hazelnut' },
          { name: 'Chocolate', value: 'chocolate' },
          { name: 'Ginger', value: 'ginger' },
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly inline', () => {
    const tree = Renderer.create(
      <RadioGroup
        value={'chocolate'}
        options={[
          { name: 'Hazelnut', value: 'hazelnut' },
          { name: 'Chocolate', value: 'chocolate' },
          { name: 'Ginger', value: 'ginger' },
        ]}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
