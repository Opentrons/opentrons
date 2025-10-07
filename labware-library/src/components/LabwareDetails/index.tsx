// full-width labware details
import { Gallery, LoadName, Tags } from '../labware-ui'
import { LabwareDetailsBox } from './LabwareDetailsBox'
import { LabwareTitle } from './LabwareTitle'
import styles from './styles.module.css'

import type { LabwareDefinition } from '../../types'

export interface LabwareDetailsProps {
  definition: LabwareDefinition
}

export function LabwareDetails(props: LabwareDetailsProps): JSX.Element {
  const { definition } = props
  const { loadName } = definition.parameters

  return (
    <>
      <LabwareTitle
        definition={definition}
        className={styles.title_container}
      />
      <div className={styles.gallery_container}>
        <Gallery definition={definition} />
        <Tags definition={definition} className={styles.tags_container} />
        <LoadName loadName={loadName} />
      </div>

      <LabwareDetailsBox
        definition={definition}
        className={styles.details_box_container}
      />
    </>
  )
}
