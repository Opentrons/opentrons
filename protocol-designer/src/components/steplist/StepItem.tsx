import * as React from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import sum from 'lodash/sum'
import { Icon } from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { THERMOCYCLER_PROFILE, THERMOCYCLER_STATE } from '../../constants'
import { stepIconsByType, PROFILE_CYCLE } from '../../form-types'
import {
  makeLidLabelText,
  makeSpeedText,
  makeTemperatureText,
  makeTimerText,
} from '../../utils'
import { PDListItem, TitledStepList } from '../lists'
import { TitledListNotes } from '../TitledListNotes'
import { AspirateDispenseHeader } from './AspirateDispenseHeader'
import { MixHeader } from './MixHeader'
import { ModuleStepItems, ModuleStepItemRow } from './ModuleStepItems'
import { PauseStepItems } from './PauseStepItems'
import { MoveLabwareHeader } from './MoveLabwareHeader'
import { SourceDestSubstep } from './SourceDestSubstep'
import { CommentStepItems } from './CommentStepItems'
import styles from './StepItem.module.css'

import type { AdditionalEquipmentEntities } from '@opentrons/step-generation'
import type { AtomicProfileStep } from '@opentrons/shared-data/protocol/types/schemaV4'
import type {
  FormData,
  StepType,
  ProfileCycleItem,
  ProfileStepItem,
} from '../../form-types'
import type {
  SubstepIdentifier,
  SubstepItemData,
  ThermocyclerProfileSubstepItem,
  WellIngredientNames,
} from '../../steplist/types'
import type { InitialDeckSetup } from '../../step-forms'

export interface StepItemProps {
  stepId: string
  description?: string | null
  rawForm?: FormData | null
  stepNumber: number
  stepType: StepType
  title?: string

  collapsed?: boolean
  error?: boolean | null
  warning?: boolean | null
  selected?: boolean
  isLastSelected?: boolean
  hovered?: boolean
  isMultiSelectMode?: boolean

  highlightStep: () => unknown
  onStepContextMenu?: (event?: React.MouseEvent) => unknown
  handleClick?: (event: React.MouseEvent) => unknown
  toggleStepCollapsed: () => unknown
  unhighlightStep: (event?: React.MouseEvent) => unknown
  children?: React.ReactNode
}

export const StepItem = (props: StepItemProps): JSX.Element => {
  const {
    stepType,
    stepNumber,
    stepId,
    collapsed,
    error,
    warning,
    selected,
    isLastSelected,
    hovered,
    unhighlightStep,
    handleClick,
    onStepContextMenu,
    toggleStepCollapsed,
    highlightStep,
    isMultiSelectMode,
  } = props
  const { t } = useTranslation('application')
  const iconName = stepIconsByType[stepType]
  let iconClassName = ''
  if (error) {
    iconClassName = styles.error_icon
  } else if (warning) {
    iconClassName = styles.warning_icon
  }
  const Description = props.description ? (
    <TitledListNotes notes={props.description} />
  ) : null

  return (
    <TitledStepList
      stepId={stepId}
      className={cx(styles.step_item_wrapper)}
      description={Description}
      iconName={error || warning ? 'alert-circle' : iconName}
      iconProps={{ className: iconClassName }}
      data-test={`StepItem_${stepNumber}`}
      title={`${stepNumber}. ${props.title || t(`stepType.${stepType}`)}`}
      onClick={handleClick}
      onContextMenu={onStepContextMenu}
      onMouseEnter={highlightStep}
      onMouseLeave={unhighlightStep}
      onCollapseToggle={toggleStepCollapsed}
      {...{ selected, collapsed, hovered, isMultiSelectMode, isLastSelected }}
    >
      {props.children}
    </TitledStepList>
  )
}

export interface StepItemContentsProps {
  rawForm: FormData | null | undefined
  stepType: StepType
  substeps: SubstepItemData | null | undefined
  ingredNames: WellIngredientNames
  labwareNicknamesById: { [labwareId: string]: string }
  additionalEquipmentEntities: AdditionalEquipmentEntities
  modules: InitialDeckSetup['modules']
  highlightSubstep: (substepIdentifier: SubstepIdentifier) => unknown
  hoveredSubstep: SubstepIdentifier | null | undefined
}

const makeDurationText = (
  durationMinutes: string,
  durationSeconds: string
): string => {
  const minutesText = Number(durationMinutes) > 0 ? `${durationMinutes}m ` : ''
  return `${minutesText}${durationSeconds || 0}s`
}

interface ProfileStepSubstepRowProps {
  step: ProfileStepItem
  stepNumber: number
  repetitionsDisplay: string | null | undefined
}
export const ProfileStepSubstepRow = (
  props: ProfileStepSubstepRowProps
): JSX.Element => {
  const { t } = useTranslation(['modules', 'application'])
  const { repetitionsDisplay, stepNumber } = props
  const { temperature, durationMinutes, durationSeconds } = props.step
  return (
    // TODO IMMEDIATELY: rename .step_subitem_channel_row class to more generic name
    <PDListItem
      className={cx(
        styles.step_subitem_channel_row,
        styles.profile_step_substep_row
      )}
    >
      <span
        className={cx(
          styles.profile_step_substep_column,
          styles.profile_step_number
        )}
      >
        {stepNumber}
      </span>
      <span className={styles.profile_block_temp}>
        {makeTemperatureText(temperature, t)}
      </span>
      <span
        className={cx(
          styles.profile_step_substep_column,
          styles.profile_center_column,
          styles.profile_step_time
        )}
      >
        {makeDurationText(durationMinutes, durationSeconds)}
      </span>
      <span className={styles.profile_step_substep_column}>
        {repetitionsDisplay ? `${repetitionsDisplay}x` : null}
      </span>
    </PDListItem>
  )
}

// this is a row under a cycle under a substep
interface ProfileCycleRowProps {
  step: ProfileStepItem
  stepNumber: number
}
const ProfileCycleRow = (props: ProfileCycleRowProps): JSX.Element => {
  const { step, stepNumber } = props
  const { t } = useTranslation(['modules', 'application'])

  return (
    <div className={styles.cycle_step_row}>
      <span className={styles.profile_step_number}>{stepNumber}</span>
      <span className={styles.profile_block_temp}>
        {makeTemperatureText(step.temperature, t)}
      </span>
      <span className={styles.align_right}>
        {makeDurationText(step.durationMinutes, step.durationSeconds)}
      </span>
    </div>
  )
}

interface ProfileCycleSubstepGroupProps {
  cycle: ProfileCycleItem
  stepNumber: number
}
export const ProfileCycleSubstepGroup = (
  props: ProfileCycleSubstepGroupProps
): JSX.Element => {
  const { steps, repetitions } = props.cycle
  return (
    <div className={styles.profile_substep_cycle}>
      <div className={styles.cycle_group}>
        {steps.map((step, index) => (
          <ProfileCycleRow
            key={index}
            stepNumber={props.stepNumber + index}
            step={step}
          />
        ))}
      </div>
      <div className={styles.cycle_repetitions}>{`${repetitions}x`}</div>
    </div>
  )
}

interface CollapsibleSubstepProps {
  children: React.ReactNode
  headerContent: React.ReactNode
}
const CollapsibleSubstep = (props: CollapsibleSubstepProps): JSX.Element => {
  const [contentCollapsed, setContentCollapsed] = React.useState<boolean>(true)
  return (
    <>
      <PDListItem border className={styles.step_subitem}>
        {props.headerContent}
        <span
          className={styles.inner_carat}
          onClick={() => {
            setContentCollapsed(!contentCollapsed)
          }}
        >
          <Icon name={contentCollapsed ? 'chevron-down' : 'chevron-up'} />
        </span>
      </PDListItem>
      {!contentCollapsed && props.children}
    </>
  )
}

const renderSubstepInfo = (
  substeps: ThermocyclerProfileSubstepItem
): JSX.Element | JSX.Element[] | null => {
  let stepNumber = 1
  const substepInfo: Array<
    | React.ReactElement<typeof ProfileCycleSubstepGroup>
    | React.ReactElement<typeof ProfileStepSubstepRow>
  > = []

  substeps.meta &&
    substeps.meta.rawProfileItems.forEach((item: any) => {
      const prevStepNumber = stepNumber
      if (item.type === PROFILE_CYCLE) {
        stepNumber += item.steps.length
        substepInfo.push(
          <ProfileCycleSubstepGroup
            cycle={item}
            stepNumber={prevStepNumber}
            key={prevStepNumber}
          />
        )
      } else {
        stepNumber++
        substepInfo.push(
          <ProfileStepSubstepRow
            step={item}
            stepNumber={prevStepNumber}
            repetitionsDisplay="1"
            key={prevStepNumber}
          />
        )
      }
    })

  return substepInfo
}

export const StepItemContents = (
  props: StepItemContentsProps
): JSX.Element | JSX.Element[] | null => {
  const {
    modules,
    rawForm,
    stepType,
    substeps,
    ingredNames,
    labwareNicknamesById,
    highlightSubstep,
    hoveredSubstep,
    additionalEquipmentEntities,
  } = props
  const { t } = useTranslation(['modules', 'application'])
  if (!rawForm) {
    return null
  }

  // pause substep component uses the delay args directly
  if (substeps && substeps.substepType === 'pause') {
    return <PauseStepItems pauseArgs={substeps.pauseStepArgs} />
  }

  if (substeps && substeps.substepType === 'comment') {
    return <CommentStepItems commentArgs={substeps.commentStepArgs} />
  }

  if (substeps && substeps.substepType === 'magnet') {
    return (
      <ModuleStepItems
        labwareNickname={substeps.labwareNickname}
        message={substeps.message}
        action={t(`actions.action`)}
        actionText={t(`actions.${substeps.engage ? 'engage' : 'disengage'}`)}
        moduleType={MAGNETIC_MODULE_TYPE}
      />
    )
  }

  if (substeps && substeps.substepType === 'temperature') {
    const temperature = makeTemperatureText(substeps.temperature, t)
    const moduleSlot =
      substeps.moduleId != null ? modules[substeps.moduleId].slot : ''

    return (
      <ModuleStepItems
        message={substeps.message}
        action={t(`actions.go_to`)}
        actionText={temperature}
        moduleType={TEMPERATURE_MODULE_TYPE}
        labwareNickname={substeps.labwareNickname}
        moduleSlot={moduleSlot}
      />
    )
  }

  if (substeps && substeps.substepType === 'heaterShaker') {
    const temperature = makeTemperatureText(
      substeps.targetHeaterShakerTemperature,
      t
    )
    const shakerValue = makeSpeedText(substeps.targetSpeed, t)
    const timer = makeTimerText(
      substeps.heaterShakerTimerMinutes,
      substeps.heaterShakerTimerSeconds,
      t
    )

    return (
      <ModuleStepItems
        action={t(`actions.go_to`)}
        actionText={temperature}
        moduleType={HEATERSHAKER_MODULE_TYPE}
        labwareNickname={substeps.labwareNickname}
      >
        <ModuleStepItemRow
          label={t(`labware_latch`)}
          value={
            substeps.latchOpen
              ? t(`actions.open`)
              : t(`actions.closed_and_locked`)
          }
        />
        <ModuleStepItemRow label={t(`shaker_label`)} value={shakerValue} />
        {substeps.heaterShakerTimerMinutes === 0 &&
        substeps.heaterShakerTimerSeconds === 0 ? null : (
          <PDListItem
            className={cx(
              styles.step_subitem_column_header,
              styles.substep_content
            )}
          >
            <span className={styles.labware_display_name}>
              {t(`actions.deactivate_after`)}
            </span>
            <span className={styles.align_right}>{timer}</span>
          </PDListItem>
        )}
      </ModuleStepItems>
    )
  }

  if (substeps && substeps.substepType === THERMOCYCLER_PROFILE) {
    return (
      <ModuleStepItems
        message={substeps.message}
        action={t(`actions.profile`)}
        actionText={t(`actions.cycling`)}
        moduleType={THERMOCYCLER_MODULE_TYPE}
        labwareNickname={substeps.labwareNickname}
      >
        <ModuleStepItemRow
          // NOTE: for TC Profile, lid label text always says "closed" bc Profile runs with lid closed.
          label={makeLidLabelText(false, t)}
          value={makeTemperatureText(substeps.profileTargetLidTemp, t)}
        />
        <CollapsibleSubstep
          headerContent={
            <span
              className={styles.collapsible_substep_header}
            >{`Profile steps (${Math.floor(
              sum(
                substeps.profileSteps.map(
                  (atomicStep: AtomicProfileStep) => atomicStep.holdTime
                )
              ) / 60
            )}+ min)`}</span>
          }
        >
          <li className={cx(styles.profile_substep_header, styles.uppercase)}>
            <span className={styles.profile_step_substep_column} />
            <span className={styles.profile_step_substep_column}>
              block temp
            </span>
            <span
              className={cx(
                styles.profile_center_column,
                styles.profile_step_substep_column
              )}
            >
              duration{' '}
            </span>
            <span className={styles.profile_step_substep_column}>cycles</span>
          </li>
          {renderSubstepInfo(substeps)}
        </CollapsibleSubstep>

        <CollapsibleSubstep
          headerContent={
            <span className={styles.collapsible_substep_header}>
              Ending hold
            </span>
          }
        >
          <ModuleStepItems
            actionText={makeTemperatureText(substeps.blockTargetTempHold, t)}
            moduleType={THERMOCYCLER_MODULE_TYPE}
            hideHeader
            labwareNickname={substeps.labwareNickname}
          />
          <ModuleStepItemRow
            label={makeLidLabelText(substeps.lidOpenHold, t)}
            value={makeTemperatureText(substeps.lidTargetTempHold, t)}
          />
        </CollapsibleSubstep>
      </ModuleStepItems>
    )
  }

  if (substeps && substeps.substepType === THERMOCYCLER_STATE) {
    const blockTemperature = makeTemperatureText(substeps.blockTargetTemp, t)
    const lidTemperature = makeTemperatureText(substeps.lidTargetTemp, t)
    const lidLabelText = makeLidLabelText(substeps.lidOpen, t)

    return (
      <ModuleStepItems
        message={substeps.message}
        action={t(`actions.hold`)}
        actionText={blockTemperature}
        moduleType={THERMOCYCLER_MODULE_TYPE}
        labwareNickname={substeps.labwareNickname}
      >
        <ModuleStepItemRow label={lidLabelText} value={lidTemperature} />
      </ModuleStepItems>
    )
  }

  if (substeps && substeps.substepType === 'waitForTemperature') {
    const temperature = makeTemperatureText(substeps.temperature, t)

    return (
      <ModuleStepItems
        message={substeps.message}
        action={t('actions.await_temperature')}
        actionText={temperature}
        moduleType={substeps.moduleType}
        labwareNickname={substeps.labwareNickname}
      />
    )
  }

  const result: JSX.Element[] = []

  // headers
  if (stepType === 'moveLiquid') {
    const sourceLabwareId = rawForm.aspirate_labware
    const destLabware = rawForm.dispense_labware

    let nickname: string | null = labwareNicknamesById[destLabware]

    if (additionalEquipmentEntities[destLabware]?.name === 'wasteChute') {
      nickname = 'Waste chute'
    } else if (additionalEquipmentEntities[destLabware]?.name === 'trashBin') {
      nickname = 'Trash bin'
    }

    result.push(
      <AspirateDispenseHeader
        key="moveLiquid-header"
        sourceLabwareNickname={labwareNicknamesById[sourceLabwareId]}
        destLabwareNickname={nickname}
      />
    )
  }

  if (stepType === 'mix') {
    const mixLabwareId = rawForm.labware
    result.push(
      <MixHeader
        key="mix-header"
        volume={rawForm.volume}
        times={rawForm.times}
        labwareNickname={labwareNicknamesById[mixLabwareId]}
      />
    )
  }

  if (stepType === 'moveLabware') {
    const gripper = rawForm.useGripper
    const labware = rawForm.labware
    result.push(
      <MoveLabwareHeader
        key="moveLabware-header"
        sourceLabwareNickname={labwareNicknamesById[labware]}
        useGripper={gripper}
        destinationSlot={rawForm.newLocation}
      />
    )
  }

  // non-header substeps
  if (
    substeps &&
    'commandCreatorFnName' in substeps &&
    (substeps.commandCreatorFnName === 'transfer' ||
      substeps.commandCreatorFnName === 'consolidate' ||
      substeps.commandCreatorFnName === 'distribute' ||
      substeps.commandCreatorFnName === 'mix')
  ) {
    result.push(
      <SourceDestSubstep
        key="substeps"
        ingredNames={ingredNames}
        substeps={substeps}
        hoveredSubstep={hoveredSubstep}
        selectSubstep={highlightSubstep}
      />
    )
  }

  return result
}
