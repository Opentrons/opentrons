// structure components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {TitleBar} from '..'

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
})
