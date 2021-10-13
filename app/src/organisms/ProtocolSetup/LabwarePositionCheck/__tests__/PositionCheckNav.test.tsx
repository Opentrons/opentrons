import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'
import { i18n } from '../../../../i18n'
import { PositionCheckNav } from '../PositionCheckNav'
import { Section } from '../types'

const MOCK_SECTIONS_1_PIPETTE_2_STEPS = [
  'PRIMARY_PIPETTE_TIPRACKS',
  'RETURN_TIP',
] as Section[]
const MOCK_SECTIONS_2_PIPETTES_3_STEPS = [
  'PRIMARY_PIPETTE_TIPRACKS',
  'SECONDARY_PIPETTE_TIPRACKS',
  'RETURN_TIP',
] as Section[]
const MOCK_SECTIONS_2_PIPETTES_4_STEPS = [
  'PRIMARY_PIPETTE_TIPRACKS',
  'SECONDARY_PIPETTE_TIPRACKS',
  'CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE',
  'RETURN_TIP',
] as Section[]

const render = (props: React.ComponentProps<typeof PositionCheckNav>) => {
  return renderWithProviders(<PositionCheckNav {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PositionCheckNav', () => {
  let props: React.ComponentProps<typeof PositionCheckNav>

  beforeEach(() => {
    props = {
      sections: MOCK_SECTIONS_1_PIPETTE_2_STEPS,
      currentSection: 'PRIMARY_PIPETTE_TIPRACKS',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
    }
  })
  it('renders a 2 step Nav with 1 pipette', () => {
    const { getByText } = render(props)
    expect(getByText('1')).toHaveStyle('backgroundColor: #00c3e6')
    getByText('Check tipracks with Left Pipette')
    expect(getByText('2')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Return tip')
  })
  it('renders a 3 step Nav with 2 pipettes', () => {
    props = {
      sections: MOCK_SECTIONS_2_PIPETTES_3_STEPS,
      currentSection: 'PRIMARY_PIPETTE_TIPRACKS',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: 'right',
    }
    const { getByText } = render(props)
    expect(getByText('1')).toHaveStyle('backgroundColor: #00c3e6')
    getByText('Check tipracks with Left Pipette')
    expect(getByText('2')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Check tipracks with Right Pipette')
    expect(getByText('3')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Return tip')
  })
  it('renders a 4 step Nav with 2 pipettes', () => {
    props = {
      sections: MOCK_SECTIONS_2_PIPETTES_4_STEPS,
      currentSection: 'PRIMARY_PIPETTE_TIPRACKS',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: 'right',
    }
    const { getByText } = render(props)
    expect(getByText('1')).toHaveStyle('backgroundColor: #00c3e6')
    getByText('Check tipracks with Left Pipette')
    expect(getByText('2')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Check tipracks with Right Pipette')
    expect(getByText('3')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Check remaining labware with Left Pipette')
    expect(getByText('4')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Return tip')
  })
  it('renders a 3 step Nav with 2 pipettes and on the second step', () => {
    props = {
      sections: MOCK_SECTIONS_2_PIPETTES_3_STEPS,
      currentSection: 'SECONDARY_PIPETTE_TIPRACKS',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: 'right',
      completedSections: ['PRIMARY_PIPETTE_TIPRACKS'],
    }
    const { getByText } = render(props)
    getByText('Check tipracks with Left Pipette')
    expect(getByText('2')).toHaveStyle('backgroundColor: #00c3e6')
    getByText('Check tipracks with Right Pipette')
    expect(getByText('3')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Return tip')
  })
})
