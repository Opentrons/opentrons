import * as React from 'react'
import { Icon } from '@opentrons/components'
import collisionImage from '../../images/modules/module_pipette_collision_warning.png'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import styles from './styles.css'

interface Props {
  showDiagram?: boolean
  magnetOnDeck?: boolean | null
  temperatureOnDeck?: boolean | null
  heaterShakerOnDeck?: boolean | null
}

type TempMagCollisonProps = Pick<Props, 'magnetOnDeck' | 'temperatureOnDeck'>
type HeaterShakerCollisonProps = Pick<Props, 'heaterShakerOnDeck'>

const HeaterShakerCollisions = (
  props: Pick<Props, 'heaterShakerOnDeck'>
): JSX.Element | null => {
  if (props.heaterShakerOnDeck == null) return null
  return (
    <React.Fragment>
      <li>
        <strong>8-Channel</strong> pipettes cannot access slots to the left or
        right of a <strong>Heater-Shaker Module GEN1.</strong>
      </li>
      <li>
        <strong>8-Channel</strong> pipettes can only access slots in front of or
        behind a <strong>Heater-Shaker Module GEN1</strong> if that labware is a
        tip rack
      </li>
    </React.Fragment>
  )
}

const TempMagCollisions = (props: TempMagCollisonProps): JSX.Element | null => {
  if (!props.magnetOnDeck && !props.temperatureOnDeck) return null
  const moduleMessage = getCrashableModulesCopy(props) || ''
  return (
    <li>
      <strong>GEN1 8-Channel</strong> pipettes cannot access slots behind{' '}
      <strong>GEN1 {moduleMessage} modules. </strong>
      <KnowledgeBaseLink to="pipetteGen1MultiModuleCollision">
        Read more here
      </KnowledgeBaseLink>
    </li>
  )
}

const PipetteModuleCollisions = (props: Props): JSX.Element | null => {
  if (
    props.magnetOnDeck == null &&
    props.temperatureOnDeck == null &&
    props.heaterShakerOnDeck == null
  )
    return null

  const body = (
    <React.Fragment>
      <HeaterShakerCollisions heaterShakerOnDeck={props.heaterShakerOnDeck} />
      <TempMagCollisions
        magnetOnDeck={props.magnetOnDeck}
        temperatureOnDeck={props.temperatureOnDeck}
      />
    </React.Fragment>
  )
  const title = 'Potential pipette-module collisions'

  return <CollisionCard body={body} title={title} showDiagram />
}
const ModuleLabwareCollisions = (
  props: HeaterShakerCollisonProps
): JSX.Element | null => {
  if (props.heaterShakerOnDeck == null) return null
  const title = 'Potential module-labware collisions'
  const body = (
    <li>
      No labware over <strong>53 mm</strong> can be placed to the left or right
      of a <strong>Heater-Shaker Module GEN1</strong> due to risk of collision
      with the labware latch.
    </li>
  )
  return <CollisionCard title={title} body={body} />
}
const ModuleModuleCollisions = (
  props: HeaterShakerCollisonProps
): JSX.Element | null => {
  if (props.heaterShakerOnDeck == null) return null
  const title = 'Potential module-module collisions'
  const body = (
    <li>
      No modules can be placed in front of or behind a{' '}
      <strong>Heater-Shaker Module GEN1.</strong>
    </li>
  )
  return <CollisionCard title={title} body={body} />
}

const CollisionCard = (props: {
  title: string
  body: React.ReactNode
  showDiagram?: boolean
}): JSX.Element | null => {
  return (
    <div className={styles.crash_info_container}>
      <div className={styles.crash_info_box}>
        <div className={styles.crash_info_title}>
          <Icon name="information" className={styles.alert_icon} />
          <strong>{props.title}</strong>
        </div>
        <ul className={styles.crash_info_list}>{props.body}</ul>
      </div>
      {props.showDiagram && (
        <img src={collisionImage} style={{ margin: 'auto' }} />
      )}
    </div>
  )
}

export function CrashInfoBox(props: Props): JSX.Element {
  return (
    <React.Fragment>
      <PipetteModuleCollisions {...props} />
      {/* the remaining collision warnings below are only relevant to a heater shaker */}
      <ModuleLabwareCollisions heaterShakerOnDeck={props.heaterShakerOnDeck} />
      <ModuleModuleCollisions heaterShakerOnDeck={props.heaterShakerOnDeck} />
    </React.Fragment>
  )
}

function getCrashableModulesCopy(props: TempMagCollisonProps): string | null {
  const { magnetOnDeck, temperatureOnDeck } = props
  if (magnetOnDeck && temperatureOnDeck) {
    return 'Temperature or Magnetic'
  } else if (magnetOnDeck) {
    return 'Magnetic'
  } else if (temperatureOnDeck) {
    return 'Temperature'
  }
  return null
}
