// button component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {FLASK} from '../icons'
import {Button, FlatButton, PrimaryButton, OutlineButton, IconButton} from '..'

describe('buttons', () => {
  const onClick = () => {}

  test('creates a button with props', () => {
    const onClick = jest.fn()
    const button = Renderer.create(
      <Button onClick={onClick}
        className='class'
        title='title'
        disabled={false}
      >
        children
      </Button>
    ).root.findByType('button')

    button.props.onClick()
    expect(button.props.className).toMatch(/\bclass\b/)
    expect(button.props.title).toBe('title')
    expect(button.props.disabled).toBe(false)
    expect(onClick).toHaveBeenCalled()
  })

  test('disabled sets onClick to undefined', () => {
    const onClick = () => {}
    const button = Renderer.create(
      <Button onClick={onClick} disabled />
    ).root.findByType('button')

    expect(button.props.disabled).toBe(true)
    expect(button.props.onClick).toBe(undefined)
  })

  test('Button renders correctly', () => {
    const tree = Renderer.create(
      <Button onClick={onClick} title='t' className='c'>
        children
      </Button>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('Button with iconName renders correctly', () => {
    const tree = Renderer.create(
      <Button onClick={onClick} title='t' className='c' iconName={FLASK}>
        children
      </Button>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('PrimaryButton renders correctly', () => {
    const tree = Renderer.create(
      <PrimaryButton onClick={onClick} title='t' className='c'>
        children
      </PrimaryButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('PrimaryButton with iconName renders correctly', () => {
    const tree = Renderer.create(
      <PrimaryButton onClick={onClick} title='t' className='c' iconName={FLASK}>
        children
      </PrimaryButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('FlatButton renders correctly', () => {
    const tree = Renderer.create(
      <FlatButton onClick={onClick} title='t' className='c'>
        children
      </FlatButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('FlatButton with iconName renders correctly', () => {
    const tree = Renderer.create(
      <FlatButton onClick={onClick} title='t' className='c' iconName={FLASK}>
        children
      </FlatButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('OutlineButton renders correctly', () => {
    const tree = Renderer.create(
      <OutlineButton onClick={onClick} title='t' className='c'>
        children
      </OutlineButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('OutlineButton with iconName renders correctly', () => {
    const tree = Renderer.create(
      <OutlineButton onClick={onClick} title='t' className='c' iconName={FLASK}>
        children
      </OutlineButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('IconButton renders correctly', () => {
    const tree = Renderer.create(
      <IconButton
        onClick={onClick}
        title='t'
        className='c'
        name='close'
        spin
        disabled
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
