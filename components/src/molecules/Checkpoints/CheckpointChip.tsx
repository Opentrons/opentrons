import { Chip } from '../../atoms'
import styles from './commonspacing.module.css'

interface Props {
  text: string
}

/** A non-interactable, system-provided step within a `Checkpoint`. */
export function CheckpointChip(props: Props): JSX.Element {
  const { text } = props
  return (
    <div className={styles.chip}>
      <Chip
        background={false}
        chipSize="small"
        type="neutral"
        text={text}
        // We're using connection-status as a generic bullet icon.
        // This is semantically weird, but it matches how it works in Figma,
        // and <Chip> has special handling to size it properly.
        iconName="connection-status"
      />
    </div>
  )
}
