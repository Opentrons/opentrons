// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { i18n } from '../../localization'
import { actions as stepsActions } from '../../ui/steps'
import { actions as steplistActions } from '../../steplist'
import { Portal } from '../portals/TopPortal'
import type { StepIdType } from '../../form-types'
import styles from './StepItem.css'

const MENU_OFFSET_PX = 5

type Props = {|
  children: ({
    makeStepOnContextMenu: StepIdType => (
      event: SyntheticMouseEvent<>
    ) => mixed,
  }) => React.Node,
|}

type Position = {| left: number | null, top: number | null |}

export const ContextMenu = (props: Props): React.Node => {
  const dispatch = useDispatch()
  const deleteStep = (stepId: StepIdType) =>
    dispatch(steplistActions.deleteStep(stepId))
  const duplicateStep = (stepId: StepIdType) =>
    dispatch(stepsActions.duplicateStep(stepId))

  const [visible, setVisible] = React.useState<boolean>(false)
  const [stepId, setStepId] = React.useState<StepIdType | null>(null)
  const [position, setPosition] = React.useState<Position>({
    left: null,
    top: null,
  })
  const menuRoot = React.useRef<?HTMLElement>(null)

  React.useEffect(() => {
    global.addEventListener('click', handleClick)
    return () => global.removeEventListener('click', handleClick)
  })

  const makeHandleContextMenu = (stepId: StepIdType) => (
    event: SyntheticMouseEvent<*>
  ) => {
    event.preventDefault()

    const clickX = event.clientX
    const clickY = event.clientY

    const screenW = window.innerWidth
    const screenH = window.innerHeight
    const rootW = menuRoot.current ? menuRoot.current.offsetWidth : 0
    const rootH = menuRoot.current ? menuRoot.current.offsetHeight : 0

    const left =
      screenW - clickX > rootW
        ? clickX + MENU_OFFSET_PX
        : clickX - rootW - MENU_OFFSET_PX
    const top =
      screenH - clickY > rootH
        ? clickY + MENU_OFFSET_PX
        : clickY - rootH - MENU_OFFSET_PX

    setVisible(true)
    setStepId(stepId)
    setPosition({ left, top })
  }

  const handleClick = (event: SyntheticMouseEvent<*>) => {
    const wasOutside = !(
      event.target instanceof Node && menuRoot.current?.contains(event.target)
    )

    if (wasOutside && visible) setVisible(false)
    setPosition({ left: null, top: null })
  }

  const handleDuplicate = () => {
    if (stepId != null) {
      duplicateStep(stepId)
      setVisible(false)
      setStepId(null)
    }
  }

  const handleDelete = () => {
    if (stepId != null && confirm(i18n.t('alert.window.confirm_delete_step'))) {
      deleteStep(stepId)
      setVisible(false)
      setStepId(null)
    }
  }

  return (
    <div>
      {props.children({
        makeStepOnContextMenu: makeHandleContextMenu,
      })}
      {visible && (
        <Portal>
          <React.Fragment>
            <div
              ref={menuRoot}
              style={{ left: position.left, top: position.top }}
              className={styles.context_menu}
            >
              <div
                onClick={handleDuplicate}
                className={styles.context_menu_item}
              >
                {i18n.t('context_menu.step.duplicate')}
              </div>
              <div onClick={handleDelete} className={styles.context_menu_item}>
                {i18n.t('context_menu.step.delete')}
              </div>
            </div>
          </React.Fragment>
        </Portal>
      )}
    </div>
  )
}
