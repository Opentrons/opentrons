import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_OPEN_LABWARE_CREATOR_FROM_BOTTOM_OF_LABWARE_LIBRARY_LIST,
} from '/app/redux/analytics'
import { LabwareCard } from '../../../../organisms/LabwareCard'
import { AddCustomLabwareSlideout } from '../../../../organisms/AddCustomLabwareSlideout'
import { useToaster } from '../../../../organisms/ToasterOven'
import { useAllLabware, useLabwareFailure, useNewLabwareName } from '../hooks'
import { Labware } from '..'
import { mockDefinition } from '/app/redux/custom-labware/__fixtures__'

vi.mock('../../../../organisms/LabwareCard')
vi.mock('../../../../organisms/AddCustomLabwareSlideout')
vi.mock('../../../../organisms/ToasterOven')
vi.mock('../hooks')
vi.mock('/app/redux/analytics')

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
    render()
    screen.getByText('labware')
    screen.getByText('Mock Labware Card')
    screen.getByRole('button', { name: 'Import' })
    screen.getByText('Category')
    screen.getByText('All')
    screen.getByText('Sort by')
    expect(screen.getByTestId('sortBy-label')).toHaveTextContent('Alphabetical')
  })
  it('renders AddCustomLabware slideout when import button is clicked', () => {
    render()
    const importButton = screen.getByRole('button', { name: 'Import' })
    fireEvent.click(importButton)
    expect(vi.mocked(AddCustomLabwareSlideout)).toHaveBeenCalled()
  })
  it('renders footer with labware creator link', () => {
    render()
    screen.getByText('Create a new labware definition')
    const btn = screen.getByRole('link', { name: 'Open Labware Creator' })
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
    render()
    const filter = screen.getByText('All')
    fireEvent.click(filter)
    screen.getByRole('button', { name: 'All' })
    screen.getByRole('button', { name: 'Well Plate' })
    screen.getByRole('button', { name: 'Tip Rack' })
    screen.getByRole('button', { name: 'Tube Rack' })
    screen.getByRole('button', { name: 'Reservoir' })
    screen.getByRole('button', { name: 'Aluminum Block' })
  })
  it('renders changes filter menu button when an option is selected', () => {
    render()
    const filter = screen.getByText('All')
    fireEvent.click(filter)
    const wellPlate = screen.getByRole('button', { name: 'Well Plate' })
    fireEvent.click(wellPlate)
    screen.getByText('Well Plate')
  })
  it('renders sort by menu when sort is clicked', () => {
    render()
    const sort = screen.getByText('Alphabetical')
    fireEvent.click(sort)
    screen.getByRole('button', { name: 'Alphabetical' })
    screen.getByRole('button', { name: 'Reverse alphabetical' })
  })

  it('renders selected sort by menu when one menu is clicked', () => {
    render()
    const sort = screen.getByText('Alphabetical')
    fireEvent.click(sort)
    const reverse = screen.getByRole('button', { name: 'Reverse alphabetical' })
    fireEvent.click(reverse)
    expect(screen.getByTestId('sortBy-label')).toHaveTextContent(
      'Reverse alphabetical'
    )
  })
})
