import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { fixtureTiprack1000ul } from '@opentrons/shared-data'

import { SelectedItem } from '../../SelectedItem'
import { InaccessibleTip } from '../InaccessibleTip'
import { NewTip } from '../NewTip'
import { NoTip } from '../NoTip'
import { TipStatus } from '../TipStatus'
import { UsedTip } from '../UsedTip'

import type { LabwareDefinition } from '@opentrons/shared-data'

vi.mock('../NewTip')
vi.mock('../UsedTip')
vi.mock('../../SelectedTip')
vi.mock('../NoTip')
vi.mock('../InaccessibleTip')

describe('TipStatus', () => {
  beforeEach(() => {
    vi.mocked(NewTip).mockReturnValue(<div>New tip</div>)
    vi.mocked(UsedTip).mockReturnValue(<div>Used tip</div>)
    vi.mocked(SelectedItem).mockReturnValue(<div>Selected item</div>)
    vi.mocked(NoTip).mockReturnValue(<div>No tip</div>)
    vi.mocked(InaccessibleTip).mockReturnValue(<div>Inaccessible tip</div>)
  })
  const mockLabwareDefinition = fixtureTiprack1000ul as LabwareDefinition

  it('should render new tip', () => {
    render(<TipStatus type="new" labwareDefinition={mockLabwareDefinition} />)
    screen.getByText('New tip')
  })

  it('should render used tip', () => {
    render(<TipStatus type="used" labwareDefinition={mockLabwareDefinition} />)
    screen.getByText('Used tip')
  })

  it('should render selected tip', () => {
    render(
      <TipStatus type="selected" labwareDefinition={mockLabwareDefinition} />
    )
    screen.getByText('Selected tip')
  })

  it('should render no tip', () => {
    render(<TipStatus type="no" labwareDefinition={mockLabwareDefinition} />)
    screen.getByText('No tip')
  })

  it('should render inaccessible tip', () => {
    render(
      <TipStatus
        type="inaccessible"
        labwareDefinition={mockLabwareDefinition}
      />
    )
    screen.getByText('Inaccessible tip')
  })
})
