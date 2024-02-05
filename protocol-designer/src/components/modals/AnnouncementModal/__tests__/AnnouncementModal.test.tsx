import * as React from 'react'
import { renderWithProviders } from '../../../../__testing-utils__' 
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../../localization'
import { getLocalStorageItem, setLocalStorageItem } from '../../../../persist'
import { useAnnouncements } from '../announcements'
import { AnnouncementModal } from '../index'

jest.mock('../../../../persist')
jest.mock('../announcements')

const mockUseAnnouncements = useAnnouncements as jest.MockedFunction<
  typeof useAnnouncements
>
const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<
  typeof getLocalStorageItem
>
const mockSetLocalStorageItem = setLocalStorageItem as jest.MockedFunction<
  typeof setLocalStorageItem
>
const render = () => {
  return renderWithProviders(<AnnouncementModal />, { i18nInstance: i18n })[0]
}

describe('AnnouncementModal', () => {
  beforeEach(() => {
    mockGetLocalStorageItem.mockReturnValue('mockHaveNotSeenKey')
    mockUseAnnouncements.mockReturnValue([
      {
        announcementKey: 'mockKey',
        message: 'mockMessage',
        heading: 'mockHeading',
        image: <div>mockImage</div>,
      },
    ])
  })
  it('renders an announcement modal that has not been seen', () => {
    render()
    screen.getByText('mockMessage')
    const heading = screen.getByText('mockHeading')
    expect(heading).toBeVisible()
    screen.getByText('mockImage')
    fireEvent.click(screen.getByRole('button', { name: 'Got It!' }))
    expect(mockSetLocalStorageItem).toHaveBeenCalled()
    expect(heading).not.toBeVisible()
  })
})
