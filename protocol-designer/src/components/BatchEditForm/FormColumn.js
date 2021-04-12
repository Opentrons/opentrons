// @flow
import * as React from 'react'
import { Box } from '@opentrons/components'
// TODO(IL, 2021-03-01): refactor these fragmented style rules (see #7402)
import styles from '../StepEditForm/StepEditForm.css'

export type FormColumnProps = {|
  children?: React.Node,
  sectionHeader?: React.Node,
|}
export const FormColumn = (props: FormColumnProps): React.Node => {
  return (
    <Box className={styles.section_column}>
      <Box className={styles.section_header}>
        <span className={styles.section_header_text}>
          {props.sectionHeader}
        </span>
      </Box>
      {props.children}
    </Box>
  )
}
