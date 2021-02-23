// button component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {
  Button,
  FlatButton,
  PrimaryButton,
  OutlineButton,
  IconButton,
} from '..'

describe('buttons', () => {
  const onClick = () => {}

  it('creates a button with props', () => {
    const onClick = jest.fn()
    const button = Renderer.create(
      <Button
        onClick={onClick}
        className="class"
        title="title"
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

  it('disabled sets onClick to undefined', () => {
    const onClick = () => {}
    const button = Renderer.create(
      <Button onClick={onClick} disabled />
    ).root.findByType('button')

    expect(button.props.disabled).toBe(true)
    expect(button.props.onClick).toBe(undefined)
  })

  it('Button renders correctly', () => {
    const tree = Renderer.create(
      <Button onClick={onClick} title="t" className="c">
        children
      </Button>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Button with iconName renders correctly', () => {
    const tree = Renderer.create(
      <Button
        onClick={onClick}
        title="t"
        className="c"
        iconName="flask-outline"
      >
        children
      </Button>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('PrimaryButton renders correctly', () => {
    const tree = Renderer.create(
      <PrimaryButton onClick={onClick} title="t" className="c">
        children
      </PrimaryButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('PrimaryButton with iconName renders correctly', () => {
    const tree = Renderer.create(
      <PrimaryButton
        onClick={onClick}
        title="t"
        className="c"
        iconName="flask-outline"
      >
        children
      </PrimaryButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('FlatButton renders correctly', () => {
    const tree = Renderer.create(
      <FlatButton onClick={onClick} title="t" className="c">
        children
      </FlatButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('FlatButton with iconName renders correctly', () => {
    const tree = Renderer.create(
      <FlatButton
        onClick={onClick}
        title="t"
        className="c"
        iconName="flask-outline"
      >
        children
      </FlatButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('OutlineButton renders correctly', () => {
    const tree = Renderer.create(
      <OutlineButton onClick={onClick} title="t" className="c">
        children
      </OutlineButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Inverted OutlineButton renders correctly', () => {
    const tree = Renderer.create(
      <OutlineButton onClick={onClick} title="t" className="c" inverted>
        children
      </OutlineButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('OutlineButton with iconName renders correctly', () => {
    const tree = Renderer.create(
      <OutlineButton
        onClick={onClick}
        title="t"
        className="c"
        iconName="flask-outline"
      >
        children
      </OutlineButton>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('IconButton renders correctly', () => {
    const tree = Renderer.create(
      <IconButton
        onClick={onClick}
        title="t"
        className="c"
        name="close"
        spin
        disabled
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
