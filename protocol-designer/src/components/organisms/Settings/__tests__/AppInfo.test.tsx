import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
const mockWindowOpen = vi.fn()
vi.stubGlobal('window.open', mockWindowOpen)

describe('AppInfo', () => {
  let props: ComponentProps<typeof AppInfo>
  let windowOpenSpy: any
  beforeEach(() => {
    props = {
      setShowAnnouncementModal: mockSetShowAnnouncementModal,
    }
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn())
  })

  afterEach(() => {
    windowOpenSpy.mockRestore()
    vi.clearAllMocks()
  })
  it('renders the app info section', () => {
    render(props)
    screen.getByText('App Info')
    screen.getByText('Protocol designer version')
    screen.getByText('fake_PD_version')
    const windowOpenButton = screen.getByRole('button', {
      name: 'Software manual',
    })
    screen.debug(windowOpenButton)
    fireEvent.click(windowOpenButton)
    expect(window.open).toHaveBeenCalledWith(DOC_URL, '_blank')
    screen.getByRole('button', { name: 'Release notes' })
  })
  it('should call the setShowAnnouncementModal when the release notes button is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Release notes' }))
    expect(mockSetShowAnnouncementModal).toHaveBeenCalled()
  })
})
