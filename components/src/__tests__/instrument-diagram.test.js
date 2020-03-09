import React from 'react'
import Renderer from 'react-test-renderer'

import { InstrumentDiagram, InstrumentGroup } from '..'

describe('InstrumentDiagram', () => {
  it('Single-channel renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram channels={1} displayCategory="GEN1" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Multi-channel renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram channels={8} displayCategory="GEN1" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Single-channel GEN2 renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram channels={1} displayCategory="GEN2" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Multi-channel GEN2 renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram channels={8} displayCategory="GEN2" />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('InstrumentGroup', () => {
  it('Renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentGroup
        left={{
          mount: 'left',
          description: 'p300 8-Channel',
          tipType: '150',
          pipetteSpecs: { channels: 8, displayCategory: 'GEN1' },
          className: 'foo',
        }}
        right={{
          mount: 'right',
          description: 'p10 Single',
          tipType: '10',
          pipetteSpecs: { channels: 1, displayCategory: 'GEN1' },
          isDisabled: true,
          className: 'blah',
        }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
