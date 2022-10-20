import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ResultsSummary } from '../ResultsSummary'
import { SECTIONS } from '../constants'

const render = (props: React.ComponentProps<typeof ResultsSummary>) => {
  return renderWithProviders(<ResultsSummary {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockWorkingOffset = {
  labwareId: 'labwareId1' ,
  location: {slotName: '1'} ,
  initialPosition: {x: 1, y: 2, z: 3} ,
  finalPosition: {x: 2, y: 3, z: 4}
}
const mockExistingOffset = {
  id: 'offset1',
  createdAt: 'fake_timestamp',
  definitionUri: 'fakeDefUri',
  location: {slotName: '2'},
  vector: {x: 1, y: 2, z: 3} ,
}
describe('ResultsSummary', () => {
  let props: React.ComponentProps<typeof ResultsSummary>

  beforeEach(() => {
    props = {
      section: SECTIONS.RESULTS_SUMMARY,
      protocolData: {labware: [], labwareDefinitions: [], commands: []} as any,
      workingOffsets: [mockWorkingOffset],
      existingOffsets: [mockExistingOffset],
      handleApplyOffsets: jest.fn(),
    }
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('renders correct copy', () => {
    const { getByText, getByRole } = render(props)
    getByText('New labware offset data')
    getByRole('button', {name:'Apply offsets'})
  })
  it('calls handle apply offsets function when button is clicked', () => {
    const { getByRole } = render(props)
    getByRole('button', {name:'Apply offsets'}).click()
    expect(props.handleApplyOffsets).toHaveBeenCalled()
  })
})
