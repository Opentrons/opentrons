// modal component tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {
  Modal,
  AlertModal,
  ContinueModal,
  ModalPage,
  SpinnerModalPage,
  Overlay,
} from '..'

describe('modals', () => {
  it('Modal has a clickable overlay', () => {
    const onCloseClick = jest.fn()
    const root = Renderer.create(
      <Modal onCloseClick={onCloseClick}>children</Modal>
    ).root

    const overlay = root.findByProps({ className: 'overlay clickable' })
    overlay.props.onClick()

    expect(onCloseClick).toHaveBeenCalled()
  })

  it('ContinueModal has continue and cancel buttons', () => {
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

    const cancelButton = root.findByProps({ title: 'Cancel' })
    const continueButton = root.findByProps({ title: 'Continue' })

    cancelButton.props.onClick()
    expect(onCancelClick).toHaveBeenCalled()

    continueButton.props.onClick()
    expect(onContinueClick).toHaveBeenCalled()
  })

  it('ContinueModal calls onCancelClick on overlay click', () => {
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

    const overlay = root.findByProps({ className: 'overlay clickable' })

    overlay.props.onClick()
    expect(onCancelClick).toHaveBeenCalled()
  })

  it('Modal renders correctly', () => {
    const tree = Renderer.create(
      <Modal onCloseClick={() => {}} className="foo">
        children
      </Modal>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Modal renders correctly with optional heading', () => {
    const tree = Renderer.create(
      <Modal
        onCloseClick={() => {}}
        className="foo"
        heading={'Heading Visible'}
      >
        children
      </Modal>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('AlertModal renders correctly', () => {
    const tree = Renderer.create(
      <AlertModal
        heading={'heading'}
        className={'style'}
        onCloseClick={() => {}}
        buttons={[
          { onClick: () => {}, children: 'a' },
          { onClick: () => {}, children: 'b' },
        ]}
      >
        children
      </AlertModal>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('ContinueModal renders correctly', () => {
    const tree = Renderer.create(
      <ContinueModal onCancelClick={() => {}} onContinueClick={() => {}}>
        children
      </ContinueModal>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('Overlay renders correctly', () => {
    const tree = Renderer.create(<Overlay onClick={() => {}} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('ModalPage renders correctly', () => {
    const tree = Renderer.create(
      <ModalPage
        titleBar={{
          title: 'Title',
          subtitle: 'Subtitle',
          back: {
            children: 'back',
            onClick: () => alert('back button clicked'),
          },
        }}
      >
        children
      </ModalPage>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('SpinnerModalPage renders correctly', () => {
    const tree = Renderer.create(
      <SpinnerModalPage
        titleBar={{
          title: 'Title',
          subtitle: 'Subtitle',
          back: {
            disabled: true,
          },
        }}
      >
        children
      </SpinnerModalPage>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
