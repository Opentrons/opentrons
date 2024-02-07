import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, SPACING_3 } from '@opentrons/components'
import collisionImage from '../../images/modules/module_pipette_collision_warning.png'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import styles from './styles.css'

interface Props {
  showDiagram?: boolean
  showMagPipetteCollisons?: boolean | null
  showTempPipetteCollisons?: boolean | null
  showHeaterShakerPipetteCollisions?: boolean
  showHeaterShakerModuleCollisions?: boolean
  showHeaterShakerLabwareCollisions?: boolean
}

type TempMagCollisonProps = Pick<
  Props,
  'showMagPipetteCollisons' | 'showTempPipetteCollisons'
>

const HeaterShakerPipetteCollisions = (): JSX.Element | null => {
  const { t } = useTranslation('alert')
  return (
    <>
      <li>
        <strong>8-Channel</strong> {t(`crash.pipettes_east_west`)}{' '}
        <strong>Heater-Shaker Module GEN1.</strong>
      </li>
      <li style={{ marginTop: SPACING_3 }}>
        <strong>8-Channel</strong> {t(`crash.pipettes_can_access_north_south`)}{' '}
        <strong>Heater-Shaker Module GEN1</strong> {t(`crash.slot_has_tiprack`)}
      </li>
    </>
  )
}

const TempMagCollisions = (props: TempMagCollisonProps): JSX.Element => {
  const { t } = useTranslation('alert')
  const moduleMessage = getCrashableModulesCopy(props) || ''
  return (
    <li style={{ marginTop: SPACING_3 }}>
      <strong>8-Channel GEN1</strong>{' '}
      {t(`crash.pipettes_cannot_access_north_south`)} {moduleMessage}.{' '}
      <KnowledgeBaseLink to="pipetteGen1MultiModuleCollision">
        {t(`crash.read_more_here`)}
      </KnowledgeBaseLink>
    </li>
  )
}

const PipetteModuleCollisions = (props: Props): JSX.Element | null => {
  if (
    !props.showMagPipetteCollisons &&
    !props.showTempPipetteCollisons &&
    !props.showHeaterShakerPipetteCollisions
  )
    return null

  const body = (
    <>
      {props.showHeaterShakerPipetteCollisions && (
        <HeaterShakerPipetteCollisions />
      )}

      {(props.showMagPipetteCollisons || props.showTempPipetteCollisons) && (
        <TempMagCollisions
          showMagPipetteCollisons={props.showMagPipetteCollisons}
          showTempPipetteCollisons={props.showTempPipetteCollisons}
        />
      )}
    </>
  )
  const title = 'Potential pipette-module collisions'

  return <CollisionCard body={body} title={title} showDiagram />
}
const ModuleLabwareCollisions = (
  props: Pick<Props, 'showHeaterShakerLabwareCollisions'>
): JSX.Element | null => {
  const { t } = useTranslation('alert')
  if (!props.showHeaterShakerLabwareCollisions) return null
  const title = 'Potential module-labware collisions'
  const body = (
    <li>
      {t(`crash.no_labware_over`)} <strong>53 mm</strong>{' '}
      {t(`crash.labware_east_west`)} <strong>Heater-Shaker Module GEN1</strong>{' '}
      {t(`crash.latch_collision`)}{' '}
    </li>
  )
  return <CollisionCard title={title} body={body} />
}
const ModuleModuleCollisions = (
  props: Pick<Props, 'showHeaterShakerModuleCollisions'>
): JSX.Element | null => {
  const { t } = useTranslation('alert')

  if (!props.showHeaterShakerModuleCollisions) return null
  const title = 'Potential module-module collisions'
  const body = (
    <li>
      {t(`crash.modules_north_south`)}{' '}
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
    <>
      <PipetteModuleCollisions {...props} />
      {/* the remaining collision warnings below are only relevant to a heater shaker */}
      <ModuleLabwareCollisions
        showHeaterShakerLabwareCollisions={
          props.showHeaterShakerLabwareCollisions
        }
      />
      <ModuleModuleCollisions
        showHeaterShakerModuleCollisions={
          props.showHeaterShakerModuleCollisions
        }
      />
    </>
  )
}

function getCrashableModulesCopy(
  props: TempMagCollisonProps
): JSX.Element | null {
  const { showMagPipetteCollisons, showTempPipetteCollisons } = props
  if (showMagPipetteCollisons && showTempPipetteCollisons) {
    return (
      <span>
        <strong>Temperature Module GEN1</strong> or a{' '}
        <strong>Magnetic Module GEN1</strong>
      </span>
    )
  } else if (showMagPipetteCollisons) {
    return <strong>Magnetic Module GEN1</strong>
  } else if (showTempPipetteCollisons) {
    return <strong>Temperature Module GEN1</strong>
  }
  return null
}
