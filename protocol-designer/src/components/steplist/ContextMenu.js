// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import type { ThunkDispatch } from '../../types'
import { i18n } from '../../localization'
import { actions as stepsActions } from '../../ui/steps'
import { actions as steplistActions } from '../../steplist'
import { Portal } from '../portals/TopPortal'
import type { StepIdType } from '../../form-types'
import styles from './StepItem.css'

const MENU_OFFSET_PX = 5

type OP = {|
  children: ({
    makeStepOnContextMenu: StepIdType => (
      event: SyntheticMouseEvent<>
    ) => mixed,
  }) => React.Node,
|}

type DP = {|
  deleteStep: StepIdType => {},
  duplicateStep: StepIdType => {},
|}

type Props = {| ...DP, ...OP |}

type State = {
  visible: boolean,
  left: ?number,
  top: ?number,
  stepId: ?StepIdType,
}

class ContextMenuComponent extends React.Component<Props, State> {
  state = {
    visible: false,
    left: null,
    top: null,
    stepId: null,
  }
  menuRoot: ?HTMLElement

  componentDidMount() {
    global.addEventListener('click', this.handleClick)
  }

  componentWillUnmount() {
    global.removeEventListener('click', this.handleClick)
  }

  makeHandleContextMenu = (stepId: StepIdType) => (
    event: SyntheticMouseEvent<*>
  ) => {
    event.preventDefault()

    const clickX = event.clientX
    const clickY = event.clientY

    this.setState({ visible: true, stepId }, () => {
      const screenW = window.innerWidth
      const screenH = window.innerHeight
      const rootW = this.menuRoot ? this.menuRoot.offsetWidth : 0
      const rootH = this.menuRoot ? this.menuRoot.offsetHeight : 0

      const left =
        screenW - clickX > rootW
          ? clickX + MENU_OFFSET_PX
          : clickX - rootW - MENU_OFFSET_PX
      const top =
        screenH - clickY > rootH
          ? clickY + MENU_OFFSET_PX
          : clickY - rootH - MENU_OFFSET_PX
      this.setState({ left, top })
    })
  }

  handleClick = (event: SyntheticMouseEvent<*>) => {
    const { visible } = this.state

    const wasOutside = !(
      this.menuRoot &&
      event.target instanceof Node &&
      this.menuRoot.contains(event.target)
    )

    if (wasOutside && visible)
      this.setState({ visible: false, left: null, top: null })
  }

  handleDuplicate = () => {
    if (this.state.stepId != null) {
      this.props.duplicateStep(this.state.stepId)
      this.setState({ stepId: null, visible: false })
    }
  }

  handleDelete = () => {
    if (
      this.state.stepId != null &&
      confirm(i18n.t('alert.window.confirm_delete_step'))
    ) {
      this.props.deleteStep(this.state.stepId)
      this.setState({ stepId: null, visible: false })
    }
  }

  render() {
    return (
      <div>
        {this.props.children({
          makeStepOnContextMenu: this.makeHandleContextMenu,
        })}
        {this.state.visible && (
          <Portal>
            <React.Fragment>
              <div
                ref={ref => {
                  this.menuRoot = ref
                }}
                style={{ left: this.state.left, top: this.state.top }}
                className={styles.context_menu}
              >
                <div
                  onClick={this.handleDuplicate}
                  className={styles.context_menu_item}
                >
                  {i18n.t('context_menu.step.duplicate')}
                </div>
                <div
                  onClick={this.handleDelete}
                  className={styles.context_menu_item}
                >
                  {i18n.t('context_menu.step.delete')}
                </div>
              </div>
            </React.Fragment>
          </Portal>
        )}
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  deleteStep: (stepId: StepIdType) =>
    dispatch(steplistActions.deleteStep(stepId)),
  duplicateStep: (stepId: StepIdType) =>
    dispatch(stepsActions.duplicateStep(stepId)),
})

export const ContextMenu = connect<Props, OP, {||}, DP, _, _>(
  null,
  mapDispatchToProps
)(ContextMenuComponent)
