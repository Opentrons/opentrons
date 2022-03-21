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

describe('ModuleCard', () => {
  let props: React.ComponentProps<typeof Banner>

  beforeEach(() => {
    props = {
      type: 'success',
      title: 'TITLE',
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
      title: 'TITLE',
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
      title: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_warning')
    getByText('TITLE')
  })
  it('renders error banner', () => {
    props = {
      type: 'error',
      title: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_error')
    getByText('TITLE')
  })
  it('renders installing banner', () => {
    props = {
      type: 'installing',
      title: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_installing')
    getByText('TITLE')
  })
  it('renders hot to touch banner', () => {
    props = {
      type: 'hot',
      title: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_hot')
    getByText('TITLE')
  })
})
