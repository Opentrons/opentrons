// modal component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {Modal, ContinueModal} from '..'

describe('modals', () => {
  test('Modal has a clickable overlay', () => {
    const onCloseClick = jest.fn()
    const root = Renderer.create(
      <Modal onCloseClick={onCloseClick}>
        children
      </Modal>
    ).root

    const overlay = root.findByProps({className: 'overlay'})
    overlay.props.onClick()

    expect(onCloseClick).toHaveBeenCalled()
  })

  test('ContinueModal has continue and cancel buttons', () => {
    const onCancelClick = jest.fn()
    const onContinueClick = jest.fn()
    const root = Renderer.create(
      <ContinueModal
        onCancelClick={onCancelClick}
        onContinueClick={onContinueClick}
      >
        children
      </ContinueModal>
    ).root

    const cancelButton = root.findByProps({title: 'Cancel'})
    const continueButton = root.findByProps({title: 'Continue'})

    cancelButton.props.onClick()
    expect(onCancelClick).toHaveBeenCalled()

    continueButton.props.onClick()
    expect(onContinueClick).toHaveBeenCalled()
  })

  test('ContinueModal calls onCancelClick on overlay click', () => {
    const onCancelClick = jest.fn()
    const onContinueClick = jest.fn()
    const root = Renderer.create(
      <ContinueModal
        onCancelClick={onCancelClick}
        onContinueClick={onContinueClick}
      >
        children
      </ContinueModal>
    ).root

    const overlay = root.findByProps({className: 'overlay'})

    overlay.props.onClick()
    expect(onCancelClick).toHaveBeenCalled()
  })

  test('Modal renders correctly', () => {
    const tree = Renderer.create(
      <Modal onCloseClick={() => {}}>
        children
      </Modal>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('ContinueModal renders correctly', () => {
    const tree = Renderer.create(
      <ContinueModal
        onCancelClick={() => {}}
        onContinueClick={() => {}}
      >
        children
      </ContinueModal>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
