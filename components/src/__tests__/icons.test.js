// icon components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import { ICON_DATA_BY_NAME } from '../icons/icon-data'
import { Icon, NotificationIcon } from '..'

const icons = Object.keys(ICON_DATA_BY_NAME)

describe('icons', () => {
  icons.forEach(icon =>
    it(`${icon} renders correctly`, () => {
      const tree = Renderer.create(
        <Icon name={`${icon}`} className="foo" />
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
        childClassName="bar"
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
