// navbar component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {VerticalNavBar, NavButton, PROTOCOL} from '..'

describe('VerticalNavBar', () => {
  test('renders correctly', () => {
    const onClick = () => {}
    const tree = Renderer.create(
      <VerticalNavBar onClick={onClick} className='c'>
        children
      </VerticalNavBar>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('NavButton', () => {
  test('creates a button with props', () => {
    const onClick = jest.fn()
    const button = Renderer.create(
      <NavButton
        onClick={onClick}
        disabled={false}
        isCurrent
        iconName={PROTOCOL}
      />
    ).root.findByType('button')

    button.props.onClick()
    expect(button.props.disabled).toBe(false)
    expect(button.props.className).toEqual('button active')
    expect(onClick).toHaveBeenCalled()
  })

  test('adds svg icon to button by name', () => {
    const icon = Renderer.create(
      <NavButton iconName={PROTOCOL} />
    ).root.findByType('svg')

    expect(icon).toBeDefined()
  })

  test('renders nav button with icon correctly', () => {
    const tree = Renderer.create(
      <NavButton iconName={PROTOCOL} disabled='false' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
