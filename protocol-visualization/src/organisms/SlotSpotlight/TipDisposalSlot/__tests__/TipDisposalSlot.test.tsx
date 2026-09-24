import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TipDisposalSlot } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

const render = () => {
  return renderWithProviders(<TipDisposalSlot />, {
    i18nInstance: i18n,
  })
}

describe('TipDisposalSlot', () => {
  it('should render the disposal body without a slot chip', () => {
    render()
    expect(screen.queryByText('TRASH')).not.toBeInTheDocument()
    expect(screen.queryByText('WASTE CHUTE')).not.toBeInTheDocument()
  })
})
