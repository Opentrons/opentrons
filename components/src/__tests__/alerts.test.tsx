// button component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import { AlertItem } from '..'

describe('alerts', () => {
  const onCloseClick = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('creates an alert with close button', () => {
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

  it('success alert renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem type={'success'} title={'good job!'} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('warning alert renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem type={'warning'} title={'warning'} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('warning alert onCloseClick renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem
        type={'warning'}
        title={'warning'}
        onCloseClick={onCloseClick}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('warning alert with message body renders correctly', () => {
    const tree = Renderer.create(
      <AlertItem type={'warning'} title={'warning'} onCloseClick={onCloseClick}>
        <h3>Title</h3>
      </AlertItem>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
