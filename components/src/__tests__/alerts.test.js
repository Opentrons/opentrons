// button component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {AlertItem} from '..'

describe('alerts', () => {
  const onCloseClick = () => {}

  test('creates an alert with close button', () => {
    const onCloseClick = jest.fn()
    const button = Renderer.create(
      <AlertItem
        type={'warning'}
        title={'warning'}
        onCloseClick={onCloseClick}
      />
    ).root.findByType('button')

    expect(button.props.className).toMatch('close')
    button.props.onClick()
    expect(onCloseClick).toHaveBeenCalled()
  })

  test('success alert renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem
        type={'success'}
        title={'good job!'}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('warning alert renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem
        type={'warning'}
        title={'warning'}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('warning alert onCloseClick renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem
        type={'warning'}
        title={'warning'}
        onCloseClick={onCloseClick}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('warning alert with message body renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem
        type={'warning'}
        title={'warning'}
        onCloseClick={onCloseClick}
      >
        <h3>Title</h3>
      </AlertItem>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
