import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TipManagement } from '../../TipManagement/'
import { ChangeTip } from '../../TipManagement/ChangeTip'
import { TipDropLocation } from '../../TipManagement/TipDropLocation'

import type { ComponentProps } from 'react'

vi.mock('../../TipManagement/ChangeTip')
vi.mock('../../TipManagement/TipDropLocation')

const render = (props: ComponentProps<typeof TipManagement>): any => {
  return renderWithProviders(<TipManagement {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipManagement', () => {
  let props: ComponentProps<typeof TipManagement>

  beforeEach(() => {
    props = {
      state: {
        changeTip: 'once',
        dropTipLocation: {
          cutoutFixtureId: 'trashBinAdapter',
        },
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
