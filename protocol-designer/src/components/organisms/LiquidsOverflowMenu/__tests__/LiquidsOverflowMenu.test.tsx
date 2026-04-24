import { createRef } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import * as labwareIngredActions from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { getLiquidEntities } from '/protocol-designer/step-forms/selectors'

import { LiquidsOverflowMenu } from '..'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

const mockLocation = vi.fn()

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/labware-ingred/selectors')
vi.mock('/protocol-designer/labware-ingred/actions')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useLocation: () => mockLocation,
  }
})

const render = (props: ComponentProps<typeof LiquidsOverflowMenu>) => {
  return renderWithProviders(<LiquidsOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LiquidsOverflowMenu', () => {
  let props: ComponentProps<typeof LiquidsOverflowMenu>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
      showLiquidsModal: vi.fn(),
      overflowWrapperRef: createRef(),
    }
    vi.mocked(selectors.getZoomedInSlot).mockReturnValue({
      slot: null,
      cutout: null,
    })
    vi.mocked(getLiquidEntities).mockReturnValue({
      '0': {
        displayColor: 'mockColor',
        displayName: 'mockname',
        liquidGroupId: '0',
        description: null,
        pythonName: 'liquid_1',
      },
    })
  })
  it('renders the overflow buttons with 1 liquid defined', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'mockname' }))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.showLiquidsModal).toHaveBeenCalled()
    expect(vi.mocked(labwareIngredActions.selectLiquidGroup)).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Define a liquid' }))
    expect(props.onClose).toHaveBeenCalled()
    expect(
      vi.mocked(labwareIngredActions.createNewLiquidGroup)
    ).toHaveBeenCalled()
    expect(props.showLiquidsModal).toHaveBeenCalled()
  })
})
