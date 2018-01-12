// icon components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {
  Icon,
  ALERT,
  BACK,
  CLOSE,
  REFRESH,
  SPINNER,
  USB,
  WIFI,
  FLASK,
  CHECKED,
  UNCHECKED,
  CHEVRON_UP,
  CHEVRON_DOWN,
  CHEVRON_LEFT,
  CHEVRON_RIGHT,
  FILE,
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

  test('close icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={CLOSE} className='foo' />
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
      <Icon name={CHEVRON_UP} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('collapse caret icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={CHEVRON_DOWN} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('left caret icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={CHEVRON_LEFT} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('right caret icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={CHEVRON_RIGHT} className='foo' />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('protocol file icon renders correctly', () => {
    const tree = Renderer.create(
      <Icon name={FILE} className='foo' />
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
