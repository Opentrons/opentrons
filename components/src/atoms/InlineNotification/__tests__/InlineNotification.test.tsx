import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InlineNotification } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof InlineNotification>) => {
  return renderWithProviders(<InlineNotification {...props} />)[0]
}

describe('InlineNotification', () => {
  let props: ComponentProps<typeof InlineNotification>

  beforeEach(() => {
    props = {
      type: 'success',
      heading: 'TITLE',
    }
  })
  it('renders success inline notification', () => {
    render(props)
    screen.getByLabelText('icon_success')
    screen.getByText('TITLE')
  })
  it('renders success inline notification with exit button and when click dismisses inline notification', () => {
    props = {
      type: 'success',
      heading: 'TITLE',
      onCloseClick: vi.fn(),
    }
    render(props)
    screen.getByText('TITLE')
    const btn = screen.getByLabelText('close_icon')
    fireEvent.click(btn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders alert inline notification', () => {
    props = {
      type: 'alert',
      heading: 'TITLE',
    }
    render(props)
    screen.getByLabelText('icon_alert')
    screen.getByText('TITLE')
  })
  it('renders error inline notification', () => {
    props = {
      type: 'error',
      heading: 'TITLE',
    }
    render(props)
    screen.getByLabelText('icon_error')
    screen.getByText('TITLE')
  })
  it('renders neutral inline notification', () => {
    props = {
      type: 'neutral',
      heading: 'TITLE',
    }
    render(props)
    screen.getByLabelText('icon_neutral')
    screen.getByText('TITLE')
  })
})
