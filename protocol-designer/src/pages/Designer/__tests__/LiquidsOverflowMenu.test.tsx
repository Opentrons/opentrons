import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { renderWithProviders } from '../../../__testing-utils__'
import { LiquidsOverflowMenu } from '../LiquidsOverflowMenu'

vi.mock('../../../labware-ingred/selectors')
vi.mock('../../../labware-ingred/actions')

const render = (props: React.ComponentProps<typeof LiquidsOverflowMenu>) => {
  return renderWithProviders(<LiquidsOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SlotOverflowMenu', () => {
  let props: React.ComponentProps<typeof LiquidsOverflowMenu>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
    }
    vi.mocked(labwareIngredSelectors.allIngredientNamesIds).mockReturnValue([
      {
        displayColor: 'mockColor',
        name: 'mockname',
        ingredientId: '0',
      },
    ])
  })
  it('renders the overflow buttons with 1 liquid defined', () => {
    render(props)
    screen.getByText('mockname')
    fireEvent.click(screen.getByTestId('mockname_0'))
    expect(props.onClose).toHaveBeenCalled()
    expect(vi.mocked(labwareIngredActions.selectLiquidGroup)).toHaveBeenCalled()
    screen.getByText('Define a liquid')
    fireEvent.click(screen.getByTestId('defineLiquid'))
    expect(props.onClose).toHaveBeenCalled()
    expect(
      vi.mocked(labwareIngredActions.createNewLiquidGroup)
    ).toHaveBeenCalled()
  })
})
