import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { Modal } from '..'

const render = (props: React.ComponentProps<typeof Modal>) => {
  return renderWithProviders(<Modal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Modal', () => {
  let props: React.ComponentProps<typeof Modal>

  beforeEach(() => {
    props = {
      type: 'info',
      children: 'children',
      title: 'title',
      onClose: jest.fn(),
      footer: 'footer',
    }
  })
  it('renders an info modal', () => {
    const { getByText, getByRole } = render(props)
    getByText('children')
    getByText('title')
    getByText('footer')
    const btn = getByRole('button', { name: /close/i })
    fireEvent.click(btn)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('renders a warning modal', () => {
    props = {
      type: 'warning',
      children: 'children',
      title: 'title',
      onClose: jest.fn(),
      footer: 'footer',
    }
    const { getByText, getByLabelText } = render(props)
    getByText('children')
    getByText('title')
    getByText('footer')
    expect(getByLabelText('alert-circle')).toHaveStyle('color: #f09d20')
  })
  it('renders an error modal', () => {
    props = {
      type: 'error',
      children: 'children',
      title: 'title',
      onClose: jest.fn(),
      footer: 'footer',
    }
    const { getByText, getByLabelText } = render(props)
    getByText('children')
    getByText('title')
    getByText('footer')
    expect(getByLabelText('alert-circle')).toHaveStyle('color: #bf0000')
  })
})
