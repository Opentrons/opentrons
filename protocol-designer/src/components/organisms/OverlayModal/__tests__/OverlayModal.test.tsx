import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { Btn } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { OverlayModal } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/tutorial/actions')

const render = (props: ComponentProps<typeof OverlayModal>) => {
  return renderWithProviders(<OverlayModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('OverlayModal', () => {
  let props: ComponentProps<typeof OverlayModal>

  beforeEach(() => {
    props = {
      header: 'header',
      subText: 'subText',
      primaryButtonText: 'primaryButtonText',
      secondaryButtonText: 'secondaryButtonText',
      onSecondaryButtonClick: () => {
        alert('Cancel')
      },
      onPrimaryButtonClick: () => {
        alert('Continue')
      },
    }
  })

  it('renders the OverlayModal with buttons', () => {
    props = {
      ...props,
    }
    render(props)
    screen.getByText('header')
    screen.getByText('subText')
    screen.getByRole('button', { name: 'secondaryButtonText' })
    screen.getByRole('button', { name: 'primaryButtonText' })
  })
})
