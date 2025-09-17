import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { removeHint } from '/protocol-designer/tutorial/actions'

import { OverlayModal, useOverlayModal } from '..'

import type { ComponentProps } from 'react'
import { Btn } from '@opentrons/components'

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
