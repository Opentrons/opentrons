// structure components tests
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Renderer from 'react-test-renderer'

import {
  PageTabs,
  TitleBar,
  Card,
  RefreshCard,
  LabeledValue,
  Splash,
  Pill,
} from '..'

describe('TitleBar', () => {
  it('adds an h1 with the title', () => {
    const heading = Renderer.create(<TitleBar title="hello" />).root.findByType(
      'h1'
    )

    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['hello'])
  })

  it('adds an optional h2 with the subtitle', () => {
    const heading = Renderer.create(
      <TitleBar title="hello" subtitle="world" />
    ).root.findByType('h2')

    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['world'])
  })

  it('add optional back button', () => {
    const onBackClick = jest.fn()
    const button = Renderer.create(
      <TitleBar title="hello" onBackClick={onBackClick} />
    ).root.findByType('button')

    button.props.onClick()
    expect(onBackClick).toHaveBeenCalled()
  })

  it('renders TitleBar without subtitle correctly', () => {
    const tree = Renderer.create(<TitleBar title="foo" />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders TitleBar with subtitle correctly', () => {
    const tree = Renderer.create(
      <TitleBar title="foo" subtitle="bar" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders TitleBar with back button correctly', () => {
    const tree = Renderer.create(
      <TitleBar title="foo" subtitle="bar" onBackClick={() => {}} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('PageTabs', () => {
  it('renders h3 links for each page', () => {
    const pages = [
      { title: 'Page1', href: '/page1', isActive: false, isDisabled: false },
      { title: 'Page2', href: '/page2', isActive: false, isDisabled: false },
    ]

    const root = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).root

    const links = root.findAllByType('a')
    expect(links).toHaveLength(2)

    links.forEach((link, index) => {
      const { title, href } = pages[index]
      expect(link.props.href).toBe(href)
      expect(link.findByType('h3').children).toEqual([title])
    })
  })

  it('does not create a link if disabled', () => {
    const pages = [
      { title: 'Page1', href: '/page1', isActive: false, isDisabled: true },
    ]

    const notLink = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).root.findByType('span')

    expect(notLink.findByType('h3').children).toEqual([pages[0].title])
  })

  it('adds active class if active', () => {
    const pages = [
      { title: 'Page1', href: '/page1', isActive: true, isDisabled: false },
    ]

    const link = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).root.findByType('a')

    expect(link.props.className).toMatch(/active/)
  })

  it('renders PageTabs correctly', () => {
    const pages = [
      { title: 'Page1', href: '/page1', isActive: true, isDisabled: false },
      { title: 'Page2', href: '/page2', isActive: false, isDisabled: true },
    ]

    const tree = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('Card', () => {
  it('renders Card correctly', () => {
    const tree = Renderer.create(
      <Card title={'title'}>children children children</Card>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('RefreshCard', () => {
  it('calls refresh on mount', () => {
    const refresh = jest.fn()
    Renderer.create(<RefreshCard id="foo" refresh={refresh} />)

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('calls refresh on id change', () => {
    const refresh = jest.fn()
    const renderer = Renderer.create(
      <RefreshCard watch="foo" refresh={refresh} />
    )

    refresh.mockClear()
    renderer.update(<RefreshCard watch="bar" refresh={refresh} />)
    expect(refresh).toHaveBeenCalledTimes(1)

    // test refresh is not called on a different props change
    refresh.mockClear()
    renderer.update(<RefreshCard watch="bar" refresh={refresh} refreshing />)
    expect(refresh).toHaveBeenCalledTimes(0)
  })

  it('renders correctly', () => {
    const tree = Renderer.create(
      <RefreshCard watch="foo" refresh={() => {}} refreshing>
        child1 child2 child3
      </RefreshCard>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('LabeledValue', () => {
  it('renders LabeledValue correctly', () => {
    const tree = Renderer.create(
      <LabeledValue label={'Label'} value={'Value'} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('Splash', () => {
  it('renders correctly with no props', () => {
    const tree = Renderer.create(<Splash />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with custom props', () => {
    const tree = Renderer.create(
      <Splash iconName="flask-outline" className="swag" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('Pill', () => {
  it('renders Pill correctly', () => {
    const tree = Renderer.create(
      <Pill color="blue" className="foo">
        Blue
      </Pill>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders Pill correctly with inverted text', () => {
    const tree = Renderer.create(
      <Pill color="blue" className="foo" invertTextColor>
        Blue
      </Pill>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
