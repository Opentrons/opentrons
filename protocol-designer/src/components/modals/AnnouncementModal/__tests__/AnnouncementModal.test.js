// @flow

import React from 'react'
import { shallow } from 'enzyme'
import * as persist from '../../../../persist'
import * as announcements from '../'

jest.mock('../')
jest.mock('../../../../persist.js')

describe('AnnouncementModal', () => {
  // let AnnouncementModal
  beforeEach(() => {
    // persist.getLocalStorageItem = jest.fn()
    // persist.setLocalStorageItem = jest.fn()
  })

  test('modal is not shown when announcement has been shown before', () => {
    // const { AnnouncementModal } = jest.requireActual('../')
    // persist.getLocalStorageItem.mockReturnValue('1.0.0')
    // announcements.getLatestAnnouncement = jest.fn().mockReturnValue({
    //   message: 'a brand spanking new feature exists',
    //   version: '1.0.0',
    // })
    const { AnnouncementModal } = jest.requireActual('../')
    console.log(AnnouncementModal)
    const wrapper = shallow(<AnnouncementModal />)

    // console.log(wrapper.debug())
  })

  test('latest announcement is always shown even if user has not seen all of them', () => {})

  test('announcement is shown when user has not seen it before', () => {})

  test('button click saves announcement version to localStorage and closes modal', () => {})
})
