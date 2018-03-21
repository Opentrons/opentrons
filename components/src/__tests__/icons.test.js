// icon components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {
  Icon,
  NotificationIcon,
  ALERT,
  BACK,
  CLOSE,
  REFRESH,
  SPINNER,
  USB,
  WIFI,
  FLASK,
  CHECKED,
  UNCHECKED,
  CHECKED_RADIO,
  UNCHECKED_RADIO,
  CHECKED_BOX,
  UNCHECKED_BOX,
  TOGGLED_OFF,
  TOGGLED_ON,
  CHEVRON_UP,
  CHEVRON_DOWN,
  CHEVRON_LEFT,
  CHEVRON_RIGHT,
  FILE,
  COG,
  CONNECT,
  CONSOLIDATE,
  DISTRIBUTE,
  MIX,
  PAUSE,
  ARROW_RIGHT,
  MENU_DOWN,
  CIRCLE,
  CALIBRATE,
  RUN,
  LOGO,
  WARNING,
  ERROR
} from '..'

const icons = [
  ALERT,
  BACK,
  CLOSE,
  REFRESH,
  SPINNER,
  USB,
  WIFI,
  FLASK,
  CHECKED,
  UNCHECKED,
  CHECKED_RADIO,
  UNCHECKED_RADIO,
  CHECKED_BOX,
  UNCHECKED_BOX,
  TOGGLED_OFF,
  TOGGLED_ON,
  CHEVRON_UP,
  CHEVRON_DOWN,
  CHEVRON_LEFT,
  CHEVRON_RIGHT,
  FILE,
  COG,
  CONNECT,
  CONSOLIDATE,
  DISTRIBUTE,
  MIX,
  PAUSE,
  ARROW_RIGHT,
  MENU_DOWN,
  CIRCLE,
  CALIBRATE,
  RUN,
  LOGO,
  WARNING,
  ERROR
]

describe('icons', () => {
  icons.forEach((icon) => test(`${icon} renders correctly`, () => {
    const tree = Renderer.create(
      <Icon name={`${icon}`} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  }))
})

describe('Notification Icon', () => {
  test('NotificationIcon renders correctly', () => {
    const tree = Renderer.create(
      <NotificationIcon
        name={FLASK}
        className='foo'
        childName={CIRCLE}
        childClassName={'bar'}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
