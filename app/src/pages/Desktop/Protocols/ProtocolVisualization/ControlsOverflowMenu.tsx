import { MenuItem } from '@opentrons/components'

import styles from './preview.module.css'

interface ControlsOverflowMenuProps {
  handleDeckView: (showRenders: boolean) => void
  showsRenders: boolean
}

export function ControlsOverflowMenu(
  props: ControlsOverflowMenuProps
): JSX.Element {
  const { handleDeckView, showsRenders } = props
  return (
    <div className={styles.controls_overflow_menu}>
      <MenuItem
        onClick={() => {
          handleDeckView(!showsRenders)
        }}
        data-testid="ProtocolOverflowMenu_run"
      >
        Switch deck view
      </MenuItem>
    </div>
  )
}
