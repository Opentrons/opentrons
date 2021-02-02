// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { DropdownField } from '../DropdownField'

describe('DropdownField', () => {
  it('populates the dropdown with value when present', () => {
    const wrapper = mount(
      <DropdownField
        onChange={jest.fn()}
        options={[
          { name: 'DNA', value: 'dna' },
          { name: 'RNA', value: 'rna' },
          { name: 'Protein', value: 'protein' },
        ]}
        value="dna"
      />
    )
    const select = wrapper.find('select')
    expect(select.prop('value')).toBe('dna')
  })

  it('populates and selects the dropdown with blank option when value is null ', () => {
    const wrapper = mount(
      <DropdownField
        onChange={jest.fn()}
        options={[
          { name: 'DNA', value: 'dna' },
          { name: 'RNA', value: 'rna' },
          { name: 'Protein', value: 'protein' },
        ]}
        value={null}
      />
    )
    const select = wrapper.find('select')
    expect(select.prop('value')).toBe('')
    expect(
      select
        .find('option')
        .first()
        .text()
    ).toBe('')
  })

  it('populates and selects the dropdown with disabled option when isIndeterminate === true ', () => {
    const wrapper = mount(
      <DropdownField
        onChange={jest.fn()}
        options={[
          { name: 'DNA', value: 'dna' },
          { name: 'RNA', value: 'rna' },
          { name: 'Protein', value: 'protein' },
        ]}
        isIndeterminate
      />
    )
    const select = wrapper.find('select')
    expect(select.prop('value')).toBe('')
    expect(
      select
        .find('option')
        .first()
        .text()
    ).toBe('-')
    expect(
      select
        .find('option')
        .first()
        .prop('disabled')
    ).toBeTruthy()
  })
})
