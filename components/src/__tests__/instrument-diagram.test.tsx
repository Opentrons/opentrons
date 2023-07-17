import React from 'react'
import Renderer from 'react-test-renderer'

import { InstrumentDiagram, InstrumentGroup } from '..'

// TODO(bc, 2021-03-03): unit test this component and split out InstrumentDiagram from InstrumentGroup

describe('InstrumentDiagram', () => {
  it('Single-channel renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram
        mount="left"
        pipetteSpecs={{ channels: 1, displayCategory: 'GEN1' }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Multi-channel renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram
        mount="left"
        pipetteSpecs={{ channels: 8, displayCategory: 'GEN1' }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Single-channel GEN2 renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram
        mount="right"
        pipetteSpecs={{ channels: 1, displayCategory: 'GEN2' }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Multi-channel GEN2 renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram
        mount="right"
        pipetteSpecs={{ channels: 8, displayCategory: 'GEN2' }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('single-channel FLEX renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram
        mount="right"
        pipetteSpecs={{ channels: 1, displayCategory: 'FLEX' }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('eight-channel FLEX renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram
        mount="right"
        pipetteSpecs={{ channels: 8, displayCategory: 'FLEX' }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('96-channel GEN1 renders correctly', () => {
    const tree = Renderer.create(
      <InstrumentDiagram
        mount="left"
        pipetteSpecs={{ channels: 96, displayCategory: 'GEN1' }}
      />
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
          pipetteSpecs: { channels: 8, displayCategory: 'GEN1' },
          isDisabled: false,
          className: 'foo',
        }}
        right={{
          mount: 'right',
          description: 'p10 Single',
          pipetteSpecs: { channels: 1, displayCategory: 'GEN1' },
          isDisabled: true,
          className: 'blah',
        }}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
