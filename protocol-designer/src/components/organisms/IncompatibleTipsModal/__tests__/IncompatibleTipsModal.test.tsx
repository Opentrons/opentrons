import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { IncompatibleTipsModal } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/feature-flags/actions')

const render = (props: ComponentProps<typeof IncompatibleTipsModal>) => {
  return renderWithProviders(<IncompatibleTipsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('IncompatibleTipsModal', () => {
  let props: ComponentProps<typeof IncompatibleTipsModal>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
      setAllowAllTipracks: vi.fn(),
    }
  })

  it('renders the text and ctas', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Incompatible tips')
    screen.getByText(
      'Incompatible tip racks cause reduced pipette accuracy and collisions. Use compatible tip racks only.'
    )
    await user.click(screen.getByText('Show more tip types'))
    expect(props.setAllowAllTipracks).toHaveBeenCalled()
    await user.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()
  })
})
