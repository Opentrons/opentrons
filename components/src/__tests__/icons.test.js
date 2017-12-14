// icon components tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {Icon, ALERT, BACK, REFRESH, SPINNER, USB, WIFI} from '..'

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
})
