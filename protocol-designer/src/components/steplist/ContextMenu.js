// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import i18n from '../../localization'
import {actions as steplistActions} from '../../steplist'
import {Portal} from '../portals/TopPortal'
import type {StepIdType} from '../../form-types'
import styles from './StepItem.css'

const MENU_OFFSET_PX = 5

type DP = {
  deleteStep: (StepIdType) => {},
  duplicateStep: (StepIdType) => {},
}
type Props = {children: ({onContextMenu: (event: SyntheticMouseEvent<>) => mixed}) => React.Node} & DP
type State = {
  visible: boolean,
  left: ?number,
  top: ?number,
  stepId: ?StepIdType,
}

class ContextMenu extends React.Component<Props, State> {
  state = {
    visible: false,
    left: null,
    top: null,
    stepId: null,
  }
  menuRoot: HTMLElement

  componentDidMount () {
    document.addEventListener('click', this.handleClick)
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleClick)
  }

  makeHandleContextMenu = (stepId: StepIdType) => (event) => {
    event.preventDefault()

    const clickX = event.clientX
    const clickY = event.clientY

    this.setState({visible: true, stepId}, () => {
      const screenW = window.innerWidth
      const screenH = window.innerHeight
      const rootW = this.menuRoot.offsetWidth
      const rootH = this.menuRoot.offsetHeight

      const left = (screenW - clickX) > rootW ? clickX + MENU_OFFSET_PX : clickX - rootW - MENU_OFFSET_PX
      const top = (screenH - clickY) > rootH ? clickY + MENU_OFFSET_PX : clickY - rootH - MENU_OFFSET_PX
      this.setState({left, top})
    })
  }

  handleClick = (event) => {
    const { visible } = this.state
    const wasOutside = !(event.target.contains === this.root)

    if (wasOutside && visible) this.setState({visible: false, left: null, top: null})
  }

  handleDuplicate = () => {
    this.props.duplicateStep(this.state.stepId)
  }

  handleDelete = () => {
    if (confirm(i18n.t('alert.confirm_delete_step'))) {
      this.props.deleteStep(this.state.stepId)
      this.setState({stepId: null})
    }
  }

  render () {
    return (
      <div>
        {this.props.children({makeStepOnContextMenu: this.makeHandleContextMenu})}
        {this.state.visible &&
          <Portal>
            <React.Fragment>
              <div
                ref={ref => { this.menuRoot = ref }}
                style={{left: this.state.left, top: this.state.top}}
                className={styles.context_menu}>
                <div
                  onClick={this.handleDuplicate}
                  className={styles.context_menu_item}>
                  {i18n.t('context_menu.step.duplicate')}
                </div>
                <div
                  onClick={this.handleDelete}
                  className={styles.context_menu_item}>
                  {i18n.t('context_menu.step.delete')}
                </div>
              </div>
            </React.Fragment>
          </Portal>
        }
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch: Dispatch<*>) => ({
  deleteStep: (stepId: StepIdType) => dispatch(steplistActions.deleteStep(stepId)),
  duplicateStep: (stepId: StepIdType) => dispatch(steplistActions.duplicateStep(stepId)),
})

export default connect(null, mapDispatchToProps)(ContextMenu)
