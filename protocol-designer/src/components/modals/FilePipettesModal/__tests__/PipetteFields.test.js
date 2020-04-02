// @flow

import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { PipetteSelect, DropdownField } from '@opentrons/components'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import { getOnlyLatestDefs } from '../../../../labware-defs/utils'
import { PipetteFields } from '../PipetteFields'
import { TiprackDiagram } from '../TiprackDiagram'
import { PipetteDiagram } from '../PipetteDiagram'

import type { LabwareDefByDefURI } from '../../../../labware-defs'

jest.mock('../../../../feature-flags/selectors')
jest.mock('../../../../labware-defs/utils.js')
jest.mock('../TiprackDiagram')

const getOnlyLatestDefsMock: JestMockFn<
  [],
  LabwareDefByDefURI
> = getOnlyLatestDefs

describe('PipetteFields', () => {
  const leftPipetteKey = 'pipettesByMount.left'
  const leftTiprackKey = `${leftPipetteKey}.tiprackDefURI`
  const leftPipetteName = `${leftPipetteKey}.pipetteName`
  const rightPipetteKey = 'pipettesByMount.left'
  const rightTiprackKey = `${rightPipetteKey}.tiprackDefURI`
  const unselectedPipette = {
    pipetteName: '',
    tiprackDefURI: '',
  }

  let props, leftPipette, rightPipette, store
  beforeEach(() => {
    store = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }

    leftPipette = {
      pipetteName: 'p300',
      tiprackDefURI: 'tiprack_300',
    }
    rightPipette = {
      pipetteName: 'p1000',
      tiprackDefURI: 'tiprack_1000',
    }
    props = {
      onFieldChange: jest.fn(),
      onSetFieldValue: jest.fn(),
      onSetFieldTouched: jest.fn(),
      onBlur: jest.fn(),
      initialTabIndex: 1,
      values: {
        left: leftPipette,
        right: rightPipette,
      },
      errors: null,
      touched: null,
    }

    getOnlyLatestDefsMock.mockReturnValue({
      tiprack_300: fixture_tiprack_300_ul,
      tiprack_1000: fixture_tiprack_1000_ul,
    })
  })

  function render(props) {
    return mount(
      <Provider store={store}>
        <PipetteFields {...props} />
      </Provider>
    )
  }

  it('renders a selection for left and right pipette with disabled tiprack select', () => {
    props.values.left = unselectedPipette
    props.values.right = unselectedPipette

    const wrapper = render(props)

    expect(wrapper.find(PipetteSelect)).toHaveLength(2)
    expect(
      wrapper
        .find(DropdownField)
        .filter({ name: leftTiprackKey })
        .prop('disabled')
    ).toBe(true)
    expect(
      wrapper
        .find(DropdownField)
        .filter({ name: rightTiprackKey })
        .prop('disabled')
    ).toBe(true)
  })

  it('selects a pipette and clears tiprack fields that has been touched', () => {
    props.values.left = unselectedPipette

    const wrapper = render(props)
    const leftPipette = wrapper.find(PipetteSelect).at(0)

    leftPipette.prop('onPipetteChange')('p50')

    expect(props.onSetFieldTouched).toHaveBeenCalledWith(leftTiprackKey, false)
    expect(props.onSetFieldValue.mock.calls).toEqual([
      [leftPipetteName, 'p50'],
      [leftTiprackKey, null],
    ])
  })

  it('undisables tiprack selection when a pipette is selected', () => {
    props.values.left.tiprackDefURI = ''

    const wrapper = render(props)

    expect(
      wrapper
        .find(DropdownField)
        .filter({ name: leftTiprackKey })
        .prop('disabled')
    ).toBe(false)
  })

  it('selects a tiprack for the pipette', () => {
    props.values.left.tiprackDefURI = ''
    const event = {
      target: {
        name: leftTiprackKey,
        value: 'tiprack_300',
      },
    }

    const wrapper = render(props)
    const leftTiprackSelect = wrapper
      .find(DropdownField)
      .filter({ name: leftTiprackKey })
    leftTiprackSelect.prop('onChange')(event)

    expect(props.onFieldChange).toHaveBeenCalledWith(event)
  })

  it('renders tiprack diagrams for selected tipracks', () => {
    props.values.left = unselectedPipette

    const wrapper = render(props)
    const tiprackDiagrams = wrapper.find(TiprackDiagram)

    expect(tiprackDiagrams).toHaveLength(2)
    expect(tiprackDiagrams.at(0).props()).toEqual({
      definitionURI: '',
    })
    expect(tiprackDiagrams.at(1).props()).toEqual({
      definitionURI: 'tiprack_1000',
    })
  })

  it('displays pipette diagrams for selected pipettes', () => {
    const wrapper = render(props)
    const pipetteDiagram = wrapper.find(PipetteDiagram)

    expect(pipetteDiagram).toHaveLength(1)
    expect(pipetteDiagram.props()).toEqual({
      leftPipette: leftPipette.pipetteName,
      rightPipette: rightPipette.pipetteName,
    })
  })
})
