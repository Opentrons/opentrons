import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../../../../__testing-utils__' 
import { i18n } from '../../../../localization'
import { getLocalStorageItem, setLocalStorageItem } from '../../../../persist'
import { useAnnouncements } from '../announcements'
import { AnnouncementModal } from '../index'

vi.mock('../../../../persist')
vi.mock('../announcements')

const render = () => {
  return renderWithProviders(<AnnouncementModal />, { i18nInstance: i18n })[0]
}

describe('AnnouncementModal', () => {
  beforeEach(() => {
    vi.mocked(getLocalStorageItem).mockReturnValue('mockHaveNotSeenKey')
    vi.mocked(useAnnouncements).mockReturnValue([
      {
        announcementKey: 'mockKey',
        message: 'mockMessage',
        heading: 'mockHeading',
        image: <div>mockImage</div>,
      },
    ])
  })
  afterEach(() => {
    cleanup()
  })
  it('renders an announcement modal that has not been seen', () => {
    render()
    screen.getByText('mockMessage')
    const heading = screen.getByText('mockHeading')
    expect(heading).toBeVisible()
    screen.getByText('mockImage')
    fireEvent.click(screen.getByRole('button', { name: 'Got It!' }))
    expect(vi.mocked(setLocalStorageItem)).toHaveBeenCalled()
    expect(heading).not.toBeVisible()
  })
})
