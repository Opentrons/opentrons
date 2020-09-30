// list and list item components tests
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Renderer from 'react-test-renderer'

import { SidePanelGroup, TitledList, ListItem } from '..'

describe('TitledList', () => {
  it('adds an h3 with the title', () => {
    const heading = Renderer.create(
      <TitledList title="hello" />
    ).root.findByType('h3')

    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['hello'])
  })

  it('adds an optional svg icon to title', () => {
    const icon = Renderer.create(
      <TitledList title="hello" iconName="flask-outline" />
    ).root.findByType('svg')

    expect(icon).toBeDefined()
  })

  it('renders TitledList without icon correctly', () => {
    const tree = Renderer.create(<TitledList title="foo" />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders TitledList with children correctly', () => {
    const tree = Renderer.create(
      <TitledList title="foo">
        <li>Woop</li>
      </TitledList>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders TitledList with onMouseEnter & onMouseLeave correctly', () => {
    const noop = () => {}

    const tree = Renderer.create(
      <TitledList title="foo" onMouseEnter={noop} onMouseLeave={noop} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders TitledList with optional icon correctly', () => {
    const tree = Renderer.create(
      <TitledList title="foo" icon="flask-outline" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders expanded TitledList correctly', () => {
    const tree = Renderer.create(
      <TitledList
        onCollapseToggle={e => {}}
        description={<span>Description</span>}
      >
        <li>1</li>
        <li>2</li>
      </TitledList>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders collapsed TitledList correctly', () => {
    const tree = Renderer.create(
      <TitledList
        onCollapseToggle={e => {}}
        description={<span>Description</span>}
        collapsed
      >
        <li>1</li>
        <li>2</li>
      </TitledList>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('ListItem', () => {
  it('creates a linked list item from props', () => {
    const linkItemProps = {
      url: '/foo/bar',
      isDisabled: false,
    }

    const root = Renderer.create(
      <MemoryRouter>
        <ListItem {...linkItemProps}>foo</ListItem>
      </MemoryRouter>
    ).root

    const link = root.findByType('a')
    expect(link.props.href).toBe(linkItemProps.url)
    expect(link.props.disabled).toBe(false)
  })

  it('adds an optional svg icon as child', () => {
    const icon = Renderer.create(
      <ListItem iconName="check-circle" />
    ).root.findByType('svg')

    expect(icon).toBeDefined()
  })

  it('renders ListItem with icon correctly', () => {
    const tree = Renderer.create(
      <ListItem to="/hello" iconName="check-circle" isDisabled="false" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders ListItem without icon correctly', () => {
    const tree = Renderer.create(
      <ListItem to="/hello" isDisabled="false" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Side Panel Group renders correctly', () => {
    const tree = Renderer.create(
      <SidePanelGroup title="title" iconName="flask-outline">
        children
      </SidePanelGroup>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Disabled Side Panel Group renders correctly', () => {
    const tree = Renderer.create(
      <SidePanelGroup title="title" iconName="flask-outline" disabled>
        children
      </SidePanelGroup>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
