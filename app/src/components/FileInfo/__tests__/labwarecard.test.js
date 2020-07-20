// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import {
  ProtocolLabwareCard,
  ProtocolLabwareProps,
} from '../ProtocolLabwareCard'
import { ProtocolLabwareList } from '../ProtocolLabwareList'

describe('Protocol Labware Card Component', () => {
  const render = ({ labware, labwareCalibrations }: ProtocolLabwareProps) => {
    return mount(
      <ProtocolLabwareCard
        labware={labware}
        labwareCalibrations={labwareCalibrations}
      />
    )
  }

  it('renders nothing when no labware exists in the protocol', () => {
    const wrapper = render({}, {})
    expect(wrapper).toEqual({})
  })

  it('passes in corectly formatted quantity and calibration to labware list', () => {
    const labwareParams = {
        opentrons_labware: {
          count: 2,
          parent: '',
          display: 'Opentrons Labware',
        },
      }
    const calibrationParams=
      {
        opentrons_labware: {
          attributes: {
            loadName: 'opentrons_labware',
            calibrationData: { offset: { value: [1, 1, 1] } },
          },
        },
      }
    const wrapper = render(labware={labwareParams} labwareCalibrations={calibrationParams})
    const labwareList = wrapper.find(ProtocolLabwareList)
    const props = labwareList.props()

    expect(labwareList.exists()).toEqual(true)
    expect(props.labware).toEqual(['opentrons_labware'])
    expect(props.quantity).toEqual(['x2'])
    const tbody = labwareList.find('tbody')
    expect(tbody).toHaveLength(1)
    expect(tbody.find('tr').find('td').length).toEqual(6)
  })
})
