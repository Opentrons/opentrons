// navigation components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import { NavButton, SidePanel, VerticalNavBar } from '..'

describe('VerticalNavBar', () => {
  it('renders correctly', () => {
    const onClick = () => {}
    const tree = Renderer.create(
      <VerticalNavBar onClick={onClick} className="c">
        children
      </VerticalNavBar>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('NavButton', () => {
  it('creates a button with props', () => {
    const onClick = jest.fn()
    const button = Renderer.create(
      <NavButton onClick={onClick} disabled={false} iconName="ot-file" />
    ).root.findByType('button')

    button.props.onClick()
    expect(button.props.disabled).toBe(false)
    expect(button.props.className).toEqual('button')
    expect(onClick).toHaveBeenCalled()
  })

  it('adds svg icon to button by name', () => {
    const icon = Renderer.create(
      <NavButton iconName="ot-file" />
    ).root.findByType('svg')

    expect(icon).toBeDefined()
  })

  it('renders nav button with icon correctly', () => {
    const tree = Renderer.create(
      <NavButton iconName="ot-file" disabled="false" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('SidePanel', () => {
  it('renders sidebar with title', () => {
    const heading = Renderer.create(
      <SidePanel title={'title'} />
    ).root.findByType('h2')
    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['title'])
  })

  it('renders close button when onClick is present', () => {
    const onClick = jest.fn()
    const button = Renderer.create(
      <SidePanel title={'title'} onCloseClick={onClick} />
    ).root.findByType('button')

    expect(button).toBeDefined()
    button.props.onClick()
    expect(onClick).toHaveBeenCalled()
  })

  it('renders closed panel when onClick present and isOpen is false', () => {
    const onClick = jest.fn()
    const panel = Renderer.create(
      <SidePanel title={'title'} isClosed="true" onCloseClick={onClick} />
    ).root.findByType('div')

    expect(panel.props.className).toEqual('panel closed')
  })

  it('renders SidePanel correctly', () => {
    const onClick = jest.fn()
    const tree = Renderer.create(
      <SidePanel title={'title'} onCloseClick={onClick} isClosed="true">
        children
      </SidePanel>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
