import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { fixtureTiprack1000ul } from '@opentrons/shared-data'

import { EmptyWell, SelectedWell } from '../../Wells'
import { InaccessibleTip } from '../InaccessibleTip'
import { NewTip } from '../NewTip'
import { TipStatus } from '../TipStatus'
import { UsedTip } from '../UsedTip'

import type { LabwareDefinition } from '@opentrons/shared-data'

vi.mock('../NewTip')
vi.mock('../UsedTip')
vi.mock('../SelectedTip')
vi.mock('../../Wells/EmptyWell')
vi.mock('../../Wells/SelectedWell')

vi.mock('../InaccessibleTip')

describe('TipStatus', () => {
  beforeEach(() => {
    vi.mocked(NewTip).mockReturnValue(<div>New tip</div>)
    vi.mocked(UsedTip).mockReturnValue(<div>Used tip</div>)
    vi.mocked(SelectedWell).mockReturnValue(<div>Selected well</div>)
    vi.mocked(EmptyWell).mockReturnValue(<div>Empty well</div>)
    vi.mocked(InaccessibleTip).mockReturnValue(<div>Inaccessible tip</div>)
  })

  it('should render new tip', () => {
    render(
      <TipStatus
        type="new"
        labwareDefinition={fixtureTiprack1000ul as LabwareDefinition}
      />
    )
    screen.getByText('New tip')
  })

  it('should render used tip', () => {
    render(
      <TipStatus
        type="used"
        labwareDefinition={fixtureTiprack1000ul as LabwareDefinition}
      />
    )
    screen.getByText('Used tip')
  })

  it('should render selected tip', () => {
    render(
      <TipStatus
        type="selected"
        labwareDefinition={fixtureTiprack1000ul as LabwareDefinition}
      />
    )
    screen.getByText('Selected well')
  })

  it('should render no tip', () => {
    render(
      <TipStatus
        type="no"
        labwareDefinition={fixtureTiprack1000ul as LabwareDefinition}
      />
    )
    screen.getByText('Empty well')
  })

  it('should render inaccessible tip', () => {
    render(
      <TipStatus
        type="inaccessible"
        labwareDefinition={fixtureTiprack1000ul as LabwareDefinition}
      />
    )
    screen.getByText('Inaccessible tip')
  })
})
