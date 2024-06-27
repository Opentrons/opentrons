import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_OPEN_LABWARE_CREATOR_FROM_BOTTOM_OF_LABWARE_LIBRARY_LIST,
} from '../../../redux/analytics'
import { LabwareCard } from '../../../organisms/LabwareCard'
import { AddCustomLabwareSlideout } from '../../../organisms/AddCustomLabwareSlideout'
import { useToaster } from '../../../organisms/ToasterOven'
import { useAllLabware, useLabwareFailure, useNewLabwareName } from '../hooks'
import { Labware } from '..'
import { mockDefinition } from '../../../redux/custom-labware/__fixtures__'

vi.mock('../../../organisms/LabwareCard')
vi.mock('../../../organisms/AddCustomLabwareSlideout')
vi.mock('../../../organisms/ToasterOven')
vi.mock('../hooks')
vi.mock('../../../redux/analytics')

const mockTrackEvent = vi.fn()
const mockMakeSnackbar = vi.fn()
const mockMakeToast = vi.fn()
const mockEatToast = vi.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Labware />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Labware', () => {
  beforeEach(() => {
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(LabwareCard).mockReturnValue(<div>Mock Labware Card</div>)
    vi.mocked(useAllLabware).mockReturnValue([{ definition: mockDefinition }])
    vi.mocked(useLabwareFailure).mockReturnValue({
      labwareFailureMessage: null,
      clearLabwareFailure: vi.fn(),
    })
    vi.mocked(useNewLabwareName).mockReturnValue({
      newLabwareName: null,
      clearLabwareName: vi.fn(),
    })
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correct title, import button and labware cards', () => {
    const [{ getByText, getByRole, getByTestId }] = render()
    getByText('labware')
    getByText('Mock Labware Card')
    getByRole('button', { name: 'Import' })
    getByText('Category')
    getByText('All')
    getByText('Sort by')
    expect(getByTestId('sortBy-label')).toHaveTextContent('Alphabetical')
  })
  it('renders AddCustomLabware slideout when import button is clicked', () => {
    const [{ getByRole }] = render()
    const importButton = getByRole('button', { name: 'Import' })
    fireEvent.click(importButton)
    expect(vi.mocked(AddCustomLabwareSlideout)).toHaveBeenCalled()
  })
  it('renders footer with labware creator link', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Create a new labware definition')
    const btn = getByRole('link', { name: 'Open Labware Creator' })
    fireEvent.click(btn)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_OPEN_LABWARE_CREATOR_FROM_BOTTOM_OF_LABWARE_LIBRARY_LIST,
      properties: {},
    })
  })
  it('renders error toast if there is a failure', () => {
    vi.mocked(useLabwareFailure).mockReturnValue({
      labwareFailureMessage: 'mock failure message',
      clearLabwareFailure: vi.fn(),
    })
    render()
    expect(mockMakeToast).toBeCalledWith(
      'mock failure message',
      'error',
      expect.any(Object)
    )
  })
  it('renders success toast if there is a new labware name', () => {
    vi.mocked(useNewLabwareName).mockReturnValue({
      newLabwareName: 'mock filename',
      clearLabwareName: vi.fn(),
    })
    render()
    expect(mockMakeToast).toBeCalledWith(
      'mock filename imported.',
      'success',
      expect.any(Object)
    )
  })
  it('renders filter by menu when it is clicked', () => {
    const [{ getByText, getByRole }] = render()
    const filter = getByText('All')
    fireEvent.click(filter)
    getByRole('button', { name: 'All' })
    getByRole('button', { name: 'Well Plate' })
    getByRole('button', { name: 'Tip Rack' })
    getByRole('button', { name: 'Tube Rack' })
    getByRole('button', { name: 'Reservoir' })
    getByRole('button', { name: 'Aluminum Block' })
  })
  it('renders changes filter menu button when an option is selected', () => {
    const [{ getByText, getByRole }] = render()
    const filter = getByText('All')
    fireEvent.click(filter)
    const wellPlate = getByRole('button', { name: 'Well Plate' })
    fireEvent.click(wellPlate)
    getByText('Well Plate')
  })
  it('renders sort by menu when sort is clicked', () => {
    const [{ getByText, getByRole }] = render()
    const sort = getByText('Alphabetical')
    fireEvent.click(sort)
    getByRole('button', { name: 'Alphabetical' })
    getByRole('button', { name: 'Reverse alphabetical' })
  })

  it('renders selected sort by menu when one menu is clicked', () => {
    const [{ getByText, getByRole, getByTestId }] = render()
    const sort = getByText('Alphabetical')
    fireEvent.click(sort)
    const reverse = getByRole('button', { name: 'Reverse alphabetical' })
    fireEvent.click(reverse)
    expect(getByTestId('sortBy-label')).toHaveTextContent(
      'Reverse alphabetical'
    )
  })
})
