import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { NoLiquid } from '../NoLiquid'

const render = () => {
  return renderWithProviders(<NoLiquid />, {
    i18nInstance: i18n,
  })
}
describe('NoLiquid', () => {
  it('should render text ', () => {
    render()
    screen.getByText('No liquids added')
    screen.getByText('Select wells to add liquid')
  })
})
