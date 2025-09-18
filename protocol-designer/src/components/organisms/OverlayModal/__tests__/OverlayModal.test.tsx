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
      children: <div>mock content</div>,
    }
  })

  it('renders the OverlayModal with no buttons', () => {
    render(props)
    screen.getByText('header')
    screen.getByText('subText')
    screen.getByText('mock content')
  })

  it('renders the OverlayModal with buttons', () => {
    props = {
      ...props,
      children: <Btn>mock button</Btn>,
    }
    render(props)
    screen.getByText('header')
    screen.getByText('subText')
    screen.getByRole('button', { name: 'mock button' })
  })
})
