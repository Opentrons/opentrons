import { SPACING } from '@opentrons/components'

import { Divider } from '/app/atoms/structure'
import {
  AdditionalCustomLabwareSourceFolder,
  AuditLogFolder,
  ClearUnavailableRobots,
  EnableDevTools,
  OverridePathToPython,
  PreventRobotCaching,
  ShowHeaterShakerAttachmentModal,
  ShowLabwareOffsetSnippets,
  UpdatedChannel,
} from '/app/organisms/Desktop/AdvancedSettings'

import styles from './advancedsettings.module.css'

export function AdvancedSettings(): JSX.Element {
  return (
    <div className={styles.container}>
      <UpdatedChannel />
      <Divider marginY={SPACING.spacing24} />
      <AdditionalCustomLabwareSourceFolder />
      <Divider marginY={SPACING.spacing24} />
      <AuditLogFolder />
      <Divider marginY={SPACING.spacing24} />
      <PreventRobotCaching />
      <Divider marginY={SPACING.spacing24} />
      <ClearUnavailableRobots />
      <Divider marginY={SPACING.spacing24} />
      <ShowHeaterShakerAttachmentModal />
      <Divider marginY={SPACING.spacing24} />
      <ShowLabwareOffsetSnippets />
      <Divider marginY={SPACING.spacing24} />
      <OverridePathToPython />
      <Divider marginY={SPACING.spacing24} />
      <EnableDevTools />
    </div>
  )
}
