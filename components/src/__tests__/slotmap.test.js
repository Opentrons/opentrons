// slot map  component tests
import React from 'react'
import Renderer from 'react-test-renderer'
import { SlotMap } from '..'

describe('SlotMap', () => {
  it('renders correctly without collision warnings or errors', () => {
    const tree = Renderer.create(<SlotMap occupiedSlots={['1']} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with collision warning', () => {
    const tree = Renderer.create(
      <SlotMap occupiedSlots={['1']} collisionSlots={['4']} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with error', () => {
    const tree = Renderer.create(
      <SlotMap occupiedSlots={['1']} isError />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with error and collision warning', () => {
    const tree = Renderer.create(
      <SlotMap occupiedSlots={['1']} collisionSlots={['4']} isError />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
