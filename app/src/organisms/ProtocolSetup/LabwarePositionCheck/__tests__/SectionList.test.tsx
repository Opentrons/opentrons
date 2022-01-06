import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'
import { i18n } from '../../../../i18n'
import { SectionList } from '../SectionList'
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

const render = (props: React.ComponentProps<typeof SectionList>) => {
  return renderWithProviders(<SectionList {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SectionList', () => {
  let props: React.ComponentProps<typeof SectionList>

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
    expect(getByText('1')).toHaveStyle('backgroundColor: C_SELECTED_DARK')
    getByText('Check tip racks with Left Pipette')
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
    expect(getByText('1')).toHaveStyle('backgroundColor: C_SELECTED_DARK')
    getByText('Check tip racks with Left Pipette')
    expect(getByText('2')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Check tip racks with Right Pipette')
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
    expect(getByText('1')).toHaveStyle('backgroundColor: C_SELECTED_DARK')
    getByText('Check tip racks with Left Pipette')
    expect(getByText('2')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Check tip racks with Right Pipette')
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
    getByText('Check tip racks with Left Pipette')
    expect(getByText('2')).toHaveStyle('backgroundColor: C_SELECTED_DARK')
    getByText('Check tip racks with Right Pipette')
    expect(getByText('3')).toHaveStyle('backgroundColor: C_DISABLED')
    getByText('Return tip')
  })
})
