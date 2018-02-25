// structure components tests
import React from 'react'
import {MemoryRouter} from 'react-router'
import Renderer from 'react-test-renderer'

import {
  PageTabs,
  TitleBar,
  VerticalNavBar,
  NavButton,
  SidePanel,
  FILE,
  Card,
  RefreshCard,
  LabeledValue
} from '..'

describe('TitleBar', () => {
  test('adds an h1 with the title', () => {
    const heading = Renderer.create(
      <TitleBar title='hello' />
    ).root.findByType('h1')

    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['hello'])
  })

  test('adds an optional h2 with the subtitle', () => {
    const heading = Renderer.create(
      <TitleBar title='hello' subtitle='world' />
    ).root.findByType('h2')

    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['world'])
  })

  test('add optional back button', () => {
    const onBackClick = jest.fn()
    const button = Renderer.create(
      <TitleBar title='hello' onBackClick={onBackClick} />
    ).root.findByType('button')

    button.props.onClick()
    expect(onBackClick).toHaveBeenCalled()
  })

  test('renders TitleBar without subtitle correctly', () => {
    const tree = Renderer.create(
      <TitleBar title='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders TitleBar with subtitle correctly', () => {
    const tree = Renderer.create(
      <TitleBar title='foo' subtitle='bar' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders TitleBar with back button correctly', () => {
    const tree = Renderer.create(
      <TitleBar title='foo' subtitle='bar' onBackClick={() => {}} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('PageTabs', () => {
  test('renders h3 links for each page', () => {
    const pages = [
      {title: 'Page1', href: '/page1', isActive: false, isDisabled: false},
      {title: 'Page2', href: '/page2', isActive: false, isDisabled: false}
    ]

    const root = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).root

    const links = root.findAllByType('a')
    expect(links).toHaveLength(2)

    links.forEach((link, index) => {
      const {title, href} = pages[index]
      expect(link.props.href).toBe(href)
      expect(link.findByType('h3').children).toEqual([title])
    })
  })

  test('does not create a link if disabled', () => {
    const pages = [
      {title: 'Page1', href: '/page1', isActive: false, isDisabled: true}
    ]

    const notLink = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).root.findByType('span')

    expect(notLink.findByType('h3').children).toEqual([pages[0].title])
  })

  test('adds active class if active', () => {
    const pages = [
      {title: 'Page1', href: '/page1', isActive: true, isDisabled: false}
    ]

    const link = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).root.findByType('a')

    expect(link.props.className).toMatch(/active/)
  })

  test('renders PageTabs correctly', () => {
    const pages = [
      {title: 'Page1', href: '/page1', isActive: true, isDisabled: false},
      {title: 'Page2', href: '/page2', isActive: false, isDisabled: true}
    ]

    const tree = Renderer.create(
      <MemoryRouter>
        <PageTabs pages={pages} />
      </MemoryRouter>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

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
        iconName={FILE}
      />
    ).root.findByType('button')

    button.props.onClick()
    expect(button.props.disabled).toBe(false)
    expect(button.props.className).toEqual('button active')
    expect(onClick).toHaveBeenCalled()
  })

  test('adds svg icon to button by name', () => {
    const icon = Renderer.create(
      <NavButton iconName={FILE} />
    ).root.findByType('svg')

    expect(icon).toBeDefined()
  })

  test('renders nav button with icon correctly', () => {
    const tree = Renderer.create(
      <NavButton iconName={FILE} disabled='false' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('SidePanel', () => {
  test('renders sidebar with title', () => {
    const heading = Renderer.create(
      <SidePanel title={'title'} />
    ).root.findByType('h2')
    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['title'])
  })

  test('renders close button when onClick is present', () => {
    const onClick = jest.fn()
    const button = Renderer.create(
      <SidePanel title={'title'} onCloseClick={onClick} />
    ).root.findByType('button')

    expect(button).toBeDefined()
    button.props.onClick()
    expect(onClick).toHaveBeenCalled()
  })

  test('renders closed panel when onClick present and isOpen is false', () => {
    const onClick = jest.fn()
    const panel = Renderer.create(
      <SidePanel title={'title'} isClosed='true' onCloseClick={onClick} />
    ).root.findByType('div')

    expect(panel.props.className).toEqual('panel closed')
  })

  test('renders SidePanel correctly', () => {
    const onClick = jest.fn()
    const tree = Renderer.create(
      <SidePanel title={'title'} onCloseClick={onClick} isClosed='true'>
        children
      </SidePanel>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('Card', () => {
  test('renders Card correctly', () => {
    const tree = Renderer.create(
      <Card title={'title'}>
        children
        children
        children
      </Card>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('RefreshCard', () => {
  test('calls refresh on mount', () => {
    const refresh = jest.fn()
    Renderer.create(
      <RefreshCard id='foo' refresh={refresh} />
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  test('calls refresh on id change', () => {
    const refresh = jest.fn()
    const renderer = Renderer.create(
      <RefreshCard watch='foo' refresh={refresh} />
    )

    refresh.mockClear()
    renderer.update(<RefreshCard watch='bar' refresh={refresh} />)
    expect(refresh).toHaveBeenCalledTimes(1)

    // test refresh is not called on a different props change
    refresh.mockClear()
    renderer.update(<RefreshCard watch='bar' refresh={refresh} refreshing />)
    expect(refresh).toHaveBeenCalledTimes(0)
  })

  test('renders correctly', () => {
    const tree = Renderer.create(
      <RefreshCard watch='foo' refresh={() => {}} refreshing>
        child1
        child2
        child3
      </RefreshCard>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('LabeledValue', () => {
  test('renders LabeledValue correctly', () => {
    const tree = Renderer.create(
      <LabeledValue label={'Label'} value={'Value'} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
