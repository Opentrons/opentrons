import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../redux/config'
import { ResultsSummary } from '../ResultsSummary'
import { SECTIONS } from '../constants'
import { mockTipRackDefinition } from '../../../redux/custom-labware/__fixtures__'
import {
  mockCompletedAnalysis,
  mockExistingOffsets,
  mockWorkingOffsets,
} from '../__fixtures__'

jest.mock('../../../redux/config')

const mockGetIsLabwareOffsetCodeSnippetsOn = getIsLabwareOffsetCodeSnippetsOn as jest.MockedFunction<
  typeof getIsLabwareOffsetCodeSnippetsOn
>

const render = (props: React.ComponentProps<typeof ResultsSummary>) => {
  return renderWithProviders(<ResultsSummary {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ResultsSummary', () => {
  let props: React.ComponentProps<typeof ResultsSummary>

  beforeEach(() => {
    props = {
      section: SECTIONS.RESULTS_SUMMARY,
      protocolData: mockCompletedAnalysis,
      workingOffsets: mockWorkingOffsets,
      existingOffsets: mockExistingOffsets,
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
    getByRole('button', { name: 'Apply offsets' })
    getByRole('link', { name: 'Need help?' })
    getByRole('columnheader', { name: 'location' })
    getByRole('columnheader', { name: 'labware' })
    getByRole('columnheader', { name: 'labware offset data' })
  })
  it('calls handle apply offsets function when button is clicked', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Apply offsets' }).click()
    expect(props.handleApplyOffsets).toHaveBeenCalled()
  })
  it('renders a row per offset to apply', () => {
    const { getByRole, queryAllByRole } = render(props)
    expect(
      queryAllByRole('cell', {
        name: mockTipRackDefinition.metadata.displayName,
      })
    ).toHaveLength(2)
    getByRole('cell', { name: 'slot 1' })
    getByRole('cell', { name: 'slot 3' })
    getByRole('cell', { name: 'X 1.0 Y 1.0 Z 1.0' })
    getByRole('cell', { name: 'X 3.0 Y 3.0 Z 3.0' })
  })

  it('renders tabbed offset data with snippets when config option is selected', () => {
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
    const { getByText } = render(props)
    expect(getByText('Table View')).toBeTruthy()
    expect(getByText('Jupyter Notebook')).toBeTruthy()
    expect(getByText('Command Line Interface (SSH)')).toBeTruthy()
  })
})
