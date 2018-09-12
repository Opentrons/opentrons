import React from 'react'
import Renderer from 'react-test-renderer'

import {InstrumentDiagram, InstrumentGroup} from '..'

describe('InstrumentDiagram', () => {
  test('Single-channel renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram channels={1} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('Multi-channel renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram channels={8} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe('InstrumentGroup', () => {
  test('Renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentGroup
        left={{
          mount: 'left',
          description: 'p300 8-Channel',
          tipType: '150',
          channels: 8,
          className: 'foo',
        }}
        right={{
          mount: 'right',
          description: 'p10 Single',
          tipType: '10',
          channels: 1,
          isDisabled: true,
          className: 'blah',
        }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
