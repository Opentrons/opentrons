import styles from './flexstackertools.module.css'
import { MessageField } from './MessageField'

import type { FieldPropsByName } from '../../types'

export function EmptySettings(props: {
  propsForFields: FieldPropsByName
}): JSX.Element {
  const { propsForFields } = props
  return (
    <div className={styles.padding_x}>
      <MessageField fieldProps={propsForFields.interventionMessage} />
    </div>
  )
}
