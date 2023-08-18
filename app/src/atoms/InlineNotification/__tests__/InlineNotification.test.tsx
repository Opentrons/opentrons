import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InlineNotification } from '..'

const render = (props: React.ComponentProps<typeof InlineNotification>) => {
  return renderWithProviders(<InlineNotification {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InlineNotification', () => {
  let props: React.ComponentProps<typeof InlineNotification>

  beforeEach(() => {
    props = {
      type: 'success',
      heading: 'TITLE',
    }
  })
  it('renders success inline notification', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_success')
    getByText('TITLE')
  })
  it('renders success inline notification with exit button and when click dismisses inline notification', () => {
    props = {
      type: 'success',
      heading: 'TITLE',
      onCloseClick: jest.fn(),
    }
    const { getByText, getByLabelText } = render(props)
    getByText('TITLE')
    const btn = getByLabelText('close_icon')
    fireEvent.click(btn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders alert inline notification', () => {
    props = {
      type: 'alert',
      heading: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_alert')
    getByText('TITLE')
  })
  it('renders error inline notification', () => {
    props = {
      type: 'error',
      heading: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_error')
    getByText('TITLE')
  })
  it('renders neutral inline notification', () => {
    props = {
      type: 'neutral',
      heading: 'TITLE',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_neutral')
    getByText('TITLE')
  })
})
