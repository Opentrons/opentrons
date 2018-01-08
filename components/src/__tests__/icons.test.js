// icon components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {
  Icon,
  ALERT,
  BACK,
  REFRESH,
  SPINNER,
  USB,
  WIFI,
  FLASK,
  CHECKED,
  UNCHECKED,
  EXPAND,
  COLLAPSE,
  PROTOCOL,
  COG,
  CONNECT
} from '..'

describe('icons', () => {
  test('alert icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={ALERT} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('back icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={BACK} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('refresh icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={REFRESH} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('spinner icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={SPINNER} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('usb icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={USB} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('wifi icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={WIFI} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('spin option adds spin class', () => {
    const icon = Renderer.create(
      <Icon name={SPINNER} spin />
    ).root.findByType('svg')

    expect(icon.props.className).toMatch(/\bspin\b/)
  })

  test('flask icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={FLASK} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('checked icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={CHECKED} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('unchecked icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={UNCHECKED} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('expand caret icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={EXPAND} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('collapse caret icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={COLLAPSE} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('protocol file icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={PROTOCOL} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('setup cog icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={COG} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('connect icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={CONNECT} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
