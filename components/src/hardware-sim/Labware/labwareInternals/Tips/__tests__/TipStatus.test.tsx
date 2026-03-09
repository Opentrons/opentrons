import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { InaccessibleTip } from '../InaccessibleTip'
import { NewTip } from '../NewTip'
import { NoTip } from '../NoTip'
import { SelectedTip } from '../SelectedTip'
import { TipStatus } from '../TipStatus'
import { UsedTip } from '../UsedTip'

vi.mock('../NewTip')
vi.mock('../UsedTip')
vi.mock('../SelectedTip')
vi.mock('../NoTip')
vi.mock('../InaccessibleTip')

describe('TipStatus', () => {
  beforeEach(() => {
    vi.mocked(NewTip).mockReturnValue(<div>New tip</div>)
    vi.mocked(UsedTip).mockReturnValue(<div>Used tip</div>)
    vi.mocked(SelectedTip).mockReturnValue(<div>Selected tip</div>)
    vi.mocked(NoTip).mockReturnValue(<div>No tip</div>)
    vi.mocked(InaccessibleTip).mockReturnValue(<div>Inaccessible tip</div>)
  })

  it('should render new tip', () => {
    render(<TipStatus type="new" />)
    screen.getByText('New tip')
  })

  it('should render used tip', () => {
    render(<TipStatus type="used" />)
    screen.getByText('Used tip')
  })

  it('should render selected tip', () => {
    render(<TipStatus type="selected" />)
    screen.getByText('Selected tip')
  })

  it('should render no tip', () => {
    render(<TipStatus type="no" />)
    screen.getByText('No tip')
  })

  it('should render inaccessible tip', () => {
    render(<TipStatus type="inaccessible" />)
    screen.getByText('Inaccessible tip')
  })
})
