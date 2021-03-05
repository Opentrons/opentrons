// icon components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import { Icon, NotificationIcon } from '..'

import { ICON_DATA_BY_NAME } from '../icons/icon-data'
import type { IconName } from '../icons'

const icons = Object.keys(ICON_DATA_BY_NAME) as IconName[]

describe('icons', () => {
  icons.forEach(icon =>
    it(`${icon} renders correctly`, () => {
      const tree = Renderer.create(
        <Icon name={icon} className="foo" />
      ).toJSON()

      expect(tree).toMatchSnapshot()
    })
  )
})

describe('Notification Icon', () => {
  it('NotificationIcon renders correctly', () => {
    const tree = Renderer.create(
      <NotificationIcon
        name="flask-outline"
        className="foo"
        childName="circle"
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
