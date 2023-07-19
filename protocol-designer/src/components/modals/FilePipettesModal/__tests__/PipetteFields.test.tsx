import React, { ChangeEvent } from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import {
  PipetteSelect,
  DropdownField,
  OutlineButton,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import { LabwareDefinition2 } from '../../../../../../shared-data/lib/js/types.d'
import { actions as labwareDefActions } from '../../../../labware-defs'
import { getOnlyLatestDefs } from '../../../../labware-defs/utils'
import { getAllowAllTipracks } from '../../../../feature-flags/selectors'
import { FormPipette } from '../../../../step-forms'

import { PipetteFields, Props } from '../PipetteFields'
import { PipetteDiagram } from '../PipetteDiagram'

import type { ActionMeta } from 'react-select'
import type { SelectOption } from '@opentrons/components'

jest.mock('../../../../feature-flags/selectors')
jest.mock('../../../../labware-defs/selectors')
jest.mock('../../../../file-data/selectors')
jest.mock('../../../../labware-defs/utils')
jest.mock('../../../../labware-defs/actions')

const getOnlyLatestDefsMock = getOnlyLatestDefs as jest.MockedFunction<
  typeof getOnlyLatestDefs
>

const createCustomTiprackDefMock = labwareDefActions.createCustomTiprackDef as jest.MockedFunction<
  typeof labwareDefActions.createCustomTiprackDef
>

const getAllowAllTipracksMock = getAllowAllTipracks as jest.MockedFunction<
  typeof getAllowAllTipracks
>

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

  let props: Props
  let leftPipette: FormPipette
  let rightPipette: FormPipette
  let store: any
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
      robotType: OT2_ROBOT_TYPE,
    }

    getOnlyLatestDefsMock.mockReturnValue({
      tiprack_300: fixture_tiprack_300_ul as LabwareDefinition2,
      tiprack_1000: fixture_tiprack_1000_ul as LabwareDefinition2,
    })
    getAllowAllTipracksMock.mockReturnValue(false)
  })

  function render(props: Props) {
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

    leftPipette.prop('onPipetteChange')(
      'p50',
      ('input-change' as unknown) as ActionMeta<SelectOption>
    )

    expect(props.onSetFieldTouched).toHaveBeenCalledWith(leftTiprackKey, false)
    expect((props.onSetFieldValue as jest.Mock).mock.calls).toEqual([
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
    leftTiprackSelect.prop('onChange')(event as ChangeEvent<HTMLSelectElement>)

    expect(props.onFieldChange).toHaveBeenCalledWith(event)
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

  it('allows the user to upload custom tip racks', () => {
    const wrapper = render(props)
    const uploadButton = wrapper.find(OutlineButton).at(0)
    expect(uploadButton.text()).toMatch('Upload custom tip rack')

    uploadButton.find('input').at(0).simulate('change')
    expect(createCustomTiprackDefMock).toHaveBeenCalled()
  })
})
