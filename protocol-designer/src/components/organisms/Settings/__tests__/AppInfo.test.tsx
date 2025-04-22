import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppInfo } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { DOC_URL } from '../../KnowledgeLink'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof AppInfo>) => {
  return renderWithProviders(<AppInfo {...props} />, {
    i18nInstance: i18n,
  })
}

const mockSetShowAnnouncementModal = vi.fn()

describe('AppInfo', () => {
  let props: ComponentProps<typeof AppInfo>
  beforeEach(() => {
    props = {
      setShowAnnouncementModal: mockSetShowAnnouncementModal,
    }
  })
  it('renders the app info section', () => {
    render(props)
    screen.getByText('App Info')
    screen.getByText('Protocol designer version')
    screen.getByText('fake_PD_version')
    expect(
      screen
        .getByRole('link', {
          name: 'Software manual',
        })
        .getAttribute('href')
    ).toBe(DOC_URL)
    screen.getByRole('button', { name: 'Release notes' })
  })
  it('should call the setShowAnnouncementModal when the release notes button is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Release notes' }))
    expect(mockSetShowAnnouncementModal).toHaveBeenCalled()
  })
})
