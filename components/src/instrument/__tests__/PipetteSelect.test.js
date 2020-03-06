// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import {
  getAllPipetteNames,
  getPipetteNameSpecs,
  GEN1,
  GEN2,
} from '@opentrons/shared-data'
import { PipetteSelect } from '../PipetteSelect'
import { Select } from '../../forms'

import type { PipetteNameSpecs } from '@opentrons/shared-data'

describe('PipetteSelect', () => {
  it('renders a Select', () => {
    const wrapper = shallow(<PipetteSelect onPipetteChange={jest.fn()} />)

    expect(wrapper.find(Select)).toHaveLength(1)
  })

  it('passes props to Select', () => {
    const tabIndex = 3
    const className = 'class'

    const selectWrapper = shallow(
      <PipetteSelect
        onPipetteChange={jest.fn()}
        tabIndex={tabIndex}
        className={className}
      />
    ).find(Select)

    expect(selectWrapper.props()).toMatchObject({
      tabIndex,
      isSearchable: false,
      menuPosition: 'fixed',
      className: expect.stringContaining('class'),
    })
  })

  it('passes pipettes as grouped options to Select', () => {
    const wrapper = shallow(<PipetteSelect onPipetteChange={jest.fn()} />)
    const pipetteSpecs: Array<PipetteNameSpecs> = getAllPipetteNames(
      'maxVolume',
      'channels'
    )
      .map(getPipetteNameSpecs)
      .filter(Boolean)

    const gen2Specs = pipetteSpecs.filter(s => s.displayCategory === GEN2)
    const gen1Specs = pipetteSpecs.filter(s => s.displayCategory === GEN1)

    expect(wrapper.find(Select).prop('options')).toEqual([
      {
        options: gen2Specs.map(s => ({ value: s.name, label: s.displayName })),
      },
      {
        options: gen1Specs.map(s => ({ value: s.name, label: s.displayName })),
      },
    ])
  })

  it('can blacklist pipettes by name', () => {
    const pipetteSpecs: Array<PipetteNameSpecs> = getAllPipetteNames(
      'maxVolume',
      'channels'
    )
      .map(getPipetteNameSpecs)
      .filter(Boolean)

    const gen2Specs = pipetteSpecs.filter(s => s.displayCategory === GEN2)
    const nameBlacklist = pipetteSpecs
      .filter(s => s.displayCategory === GEN1)
      .map(s => s.name)

    const wrapper = shallow(
      <PipetteSelect
        onPipetteChange={jest.fn()}
        nameBlacklist={nameBlacklist}
      />
    )

    expect(wrapper.find(Select).prop('options')).toEqual([
      {
        options: gen2Specs.map(s => ({ value: s.name, label: s.displayName })),
      },
    ])
  })

  it('maps pipetteName prop to Select value', () => {
    const pipetteName = 'p300_single_gen2'
    const pipetteSpecs = getPipetteNameSpecs(pipetteName)
    const expectedOption = {
      value: pipetteName,
      label: pipetteSpecs?.displayName,
    }

    const wrapper = shallow(
      <PipetteSelect
        pipetteName={'p300_single_gen2'}
        onPipetteChange={jest.fn()}
      />
    )

    expect(wrapper.find(Select).prop('value')).toEqual(expectedOption)
  })

  it('allows "None" as an option', () => {
    const expectedNone = { value: '', label: 'None' }
    const selectWrapper = shallow(
      <PipetteSelect onPipetteChange={jest.fn()} enableNoneOption />
    ).find(Select)

    expect(selectWrapper.prop('defaultValue')).toEqual(expectedNone)
    expect(selectWrapper.prop('options')).toContainEqual(expectedNone)
  })
})
