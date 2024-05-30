import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { ChangeTip } from '../../TipManagement/ChangeTip'
import { TipDropLocation } from '../../TipManagement/TipDropLocation'
import { TipManagement } from '../../TipManagement/'

vi.mock('../../TipManagement/ChangeTip')
vi.mock('../../TipManagement/TipDropLocation')

const render = (props: React.ComponentProps<typeof TipManagement>) => {
  return renderWithProviders(<TipManagement {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipManagement', () => {
  let props: React.ComponentProps<typeof TipManagement>

  beforeEach(() => {
    props = {
      state: {
        changeTip: 'once',
        dropTipLocation: 'trashBin',
      } as any,
      dispatch: vi.fn(),
    }
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders tip management options and their values', () => {
    render(props)
    screen.getByText('Change tip')
    screen.getByText('Once at the start of the transfer')
    screen.getByText('Tip drop location')
    screen.getByText('Trash bin')
  })
  it('renders Change tip component when seleted', () => {
    render(props)
    const changeTip = screen.getByText('Change tip')
    fireEvent.click(changeTip)
    expect(vi.mocked(ChangeTip)).toHaveBeenCalled()
  })
  it('renders Drop tip location component when seleted', () => {
    render(props)
    const tipDrop = screen.getByText('Tip drop location')
    fireEvent.click(tipDrop)
    expect(vi.mocked(TipDropLocation)).toHaveBeenCalled()
  })
})
