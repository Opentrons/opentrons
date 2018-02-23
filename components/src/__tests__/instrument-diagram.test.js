import React from 'react'
import Renderer from 'react-test-renderer'

import {InstrumentDiagram} from '..'

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
