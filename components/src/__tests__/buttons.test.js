// button component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {PrimaryButton} from '../buttons'

describe('PrimaryButton', () => {
  test('creates a button with props', () => {
    const onClick = jest.fn()
    const button = Renderer.create(
      <PrimaryButton onClick={onClick}
        className='class'
        title='title'
        disabled={false}
      >
        children
      </PrimaryButton>
    ).root.findByType('button')

    button.props.onClick()
    expect(button.props.className).toMatch(/class/)
    expect(button.props.title).toBe('title')
    expect(button.props.disabled).toBe(false)
    expect(button.children).toEqual(['children'])
    expect(onClick).toHaveBeenCalled()
  })

  test('disabled sets onClick to false', () => {
    const onClick = () => {}
    const button = Renderer.create(
      <PrimaryButton onClick={onClick} disabled />
    ).root.findByType('button')

    expect(button.props.disabled).toBe(true)
    expect(button.props.onClick).toBe(false)
  })

  test('renders correctly', () => {
    const onClick = () => {}
    const tree = Renderer.create(
      <PrimaryButton onClick={onClick} title='t' className='c'>
        children
      </PrimaryButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
