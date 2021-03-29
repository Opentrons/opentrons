// navigation components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import { SidePanel } from '..'

describe('SidePanel', () => {
  it('renders sidebar with title', () => {
    const heading = Renderer.create(
      <SidePanel title={'title'} />
    ).root.findByType('h2')

    expect(heading).toBeDefined()
    expect(heading.children).toEqual(['title'])
  })
})
