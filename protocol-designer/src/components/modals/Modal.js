// @flow
import * as React from 'react'
import omit from 'lodash/omit'

import styles from './Modal.css'

type ModalProps = {
  onClickAway?: (event: ?SyntheticEvent<>) => void,
  children?: React.Node
}

export default class Modal extends React.Component<ModalProps> {
  outerRef: ?HTMLElement

  handleClickAway = (e: SyntheticEvent<>) => {
    // Only trigger onClickAway callback if the click is on the modal's gray background
    if (e.target === this.outerRef && this.props.onClickAway) {
      this.props.onClickAway(e)
    }
  }

  setOuterRef = (ref: ?HTMLElement): void => {
    this.outerRef = ref
  }

  render () {
    return (
      <div ref={this.setOuterRef} className={styles.modal} onClick={this.handleClickAway} >
        <div className={styles.modal_content}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export const modalHOC = <C>(ChildComponent: React.ComponentType<C>) =>
  (props: ModalProps & C): React.Element<typeof Modal> => {
    return (
      <Modal onClickAway={props.onClickAway} >
        <ChildComponent {...omit(props, 'onClickAway')} />
      </Modal>
    )
  }
