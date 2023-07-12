import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { Banner } from '..'

const render = (props: React.ComponentProps<typeof Banner>) => {
  return renderWithProviders(<Banner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Banner', () => {
  let props: React.ComponentProps<typeof Banner>

  beforeEach(() => {
    props = {
      type: 'success',
      children: 'TITLE',
    }
  })
  it('renders success banner', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_success')
    getByText('TITLE')
  })
  it('renders success banner with exit button and when click dismisses banner', () => {
    props = {
      type: 'success',
      children: 'TITLE',
      onCloseClick: jest.fn(),
    }
    const { getByText, getByLabelText } = render(props)
    getByText('TITLE')
    const btn = getByLabelText('close_icon')
    fireEvent.click(btn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders warning banner', () => {
    props = {
      type: 'warning',
      children: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_warning')
    getByText('TITLE')
  })
  it('renders error banner', () => {
    props = {
      type: 'error',
      children: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_error')
    getByText('TITLE')
  })
  it('renders updating banner', () => {
    props = {
      type: 'updating',
      children: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_updating')
    getByText('TITLE')
  })
  it('renders custom icon banner', () => {
    props = {
      type: 'warning',
      children: 'TITLE',
      icon: { name: 'ot-hot-to-touch' },
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_warning')
    getByText('TITLE')
  })
  it('renders custom close', () => {
    props = {
      type: 'warning',
      children: 'TITLE',
      closeButton: 'close button',
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)
    const btn = getByText('close button')
    fireEvent.click(btn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
