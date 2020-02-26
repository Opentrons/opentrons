// @flow

import React from 'react'
import { shallow } from 'enzyme'
import { Modal, OutlineButton } from '@opentrons/components'
import * as persist from '../../../../persist'
import { AnnouncementModal, localStorageKey } from '../'
import * as announcements from '../announcements'
import type { Announcement } from '../announcements'

jest.mock('../../../../persist.js')

describe('AnnouncementModal', () => {
  const appVersion = '1.0.0'
  const getLocalStorageItemMock: JestMockFn<[string], mixed> =
    persist.getLocalStorageItem

  const announcementsMock: {
    announcements: Array<Announcement>,
  } = announcements

  test('modal is not shown when announcement has been shown before', () => {
    getLocalStorageItemMock.mockReturnValue(appVersion)
    announcementsMock.announcements = [
      {
        message: 'test',
        version: appVersion,
      },
    ]

    const wrapper = shallow(<AnnouncementModal />)

    expect(wrapper.find(Modal)).toHaveLength(0)
  })

  test('announcement is shown when user has not seen it before', () => {
    getLocalStorageItemMock.mockReturnValue(appVersion)
    announcementsMock.announcements = [
      {
        message: 'brand new spanking feature',
        version: '1.1.0',
      },
    ]

    const wrapper = shallow(<AnnouncementModal />)
    const modal = wrapper.find(Modal)

    expect(modal).toHaveLength(1)
    expect(modal.html()).toContain('brand new spanking feature')
  })

  test('latest announcement is always shown', () => {
    getLocalStorageItemMock.mockReturnValue(appVersion)
    announcementsMock.announcements = [
      {
        message: 'first announcement',
        version: appVersion,
      },
      {
        message: 'second announcement',
        version: '1.1.0',
      },
    ]

    const wrapper = shallow(<AnnouncementModal />)
    const modal = wrapper.find(Modal)

    expect(modal).toHaveLength(1)
    expect(modal.html()).toContain('second announcement')
  })

  test('button click saves announcement version to localStorage and closes modal', () => {
    getLocalStorageItemMock.mockReturnValue(appVersion)
    announcementsMock.announcements = [
      {
        message: 'brand new spanking feature',
        version: '1.1.0',
      },
    ]

    const wrapper = shallow(<AnnouncementModal />)
    const button = wrapper.find(OutlineButton)
    button.simulate('click')

    expect(persist.setLocalStorageItem).toHaveBeenCalledWith(
      localStorageKey,
      '1.1.0'
    )
    expect(wrapper.find(Modal)).toHaveLength(0)
  })
})
