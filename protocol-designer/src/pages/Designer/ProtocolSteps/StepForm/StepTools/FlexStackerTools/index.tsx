import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { Chip, Divider, InfoScreen, StyledText } from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_V1,
  getIsTiprack,
  getMaxPoolCount,
} from '@opentrons/shared-data'
import { flexStackerStateGetter } from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import {
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_RETRIEVE,
  FLEX_STACKER_STORE,
} from '/protocol-designer/constants'
import {
  getCurrentFormIsPresaved,
  getLabwareEntities,
  getModuleEntities,
} from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import { getFlexStackerLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { EmptySettings } from './EmptySettings'
import styles from './flexstackertools.module.css'
import { RefillSettings } from './RefillSettings'
import { StackerContentItem } from './StackerContentItem'
import { StackerControls } from './StackerControls'
import { getIsStackerFillEnabled } from './utils.ts/getIsStackerFillEnabled'
import { getIsStackerRetrieveEnabled } from './utils.ts/getIsStackerRetrieveEnabled'
import { getIsStackerStoreEnabled } from './utils.ts/getIsStackerStoreEnabled'
import { getStoredLabwareDefinitions } from './utils.ts/getStoredLabwareDefinitions'
import { getStoredLabwareInfo } from './utils.ts/getStoredLabwareInfo'

import type { ReactNode } from 'react'
import type { FlexStackerFormType } from '/protocol-designer/form-types'
import type { StepFormProps } from '../../types'

export function FlexStackerTools(props: StepFormProps): ReactNode {
  const { formData, propsForFields, showFormErrors } = props
  const { t } = useTranslation('form')
  const dispatch = useDispatch()
  const isFormPresaved = useSelector(getCurrentFormIsPresaved)

  const robotState = useSelector(getRobotStateAtActiveItem)
  const flexStackerOptions = useSelector(getFlexStackerLabwareOptions)
  const labwareEntities = useSelector(getLabwareEntities)
  const moduleEntities = useSelector(getModuleEntities)
  const nicknamesById = useSelector(getLabwareNicknamesById)
  const moduleId = formData.moduleId as string
  const { model } =
    moduleId != null
      ? moduleEntities[moduleId]
      : { model: FLEX_STACKER_MODULE_V1 }

  const moduleState =
    robotState != null ? flexStackerStateGetter(robotState, moduleId) : null
  const { labwareInHopper, labwareOnShuttle, storedLabwareDetails } =
    moduleState ?? {}
  const numLabwareInHopper =
    labwareInHopper != null ? labwareInHopper.length : 0

  const isStackerStoreEnabled =
    moduleState != null &&
    getIsStackerStoreEnabled(moduleState, labwareEntities)
  const isStackerRetrieveEnabled =
    moduleState != null && getIsStackerRetrieveEnabled(moduleState)
  const isStackerFillEnabled =
    moduleState != null && getIsStackerFillEnabled(moduleState)
  const isStackerEmptyEnabled = numLabwareInHopper > 0
  const firstFormTypeOption = ((): FlexStackerFormType | null => {
    if (isStackerStoreEnabled) {
      return FLEX_STACKER_STORE
    } else if (isStackerRetrieveEnabled) {
      return FLEX_STACKER_RETRIEVE
    } else if (isStackerEmptyEnabled) {
      return FLEX_STACKER_EMPTY
    }
    // design specifies to never hide the refill option, even if the stacker does not have stored labware details
    return FLEX_STACKER_FILL
  })()

  // preselect the first form option on mount if the form is presaved
  useEffect(
    () => {
      if (isFormPresaved && moduleId != null && firstFormTypeOption != null) {
        propsForFields.flexStackerFormType.updateValue(firstFormTypeOption)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moduleId]
  )

  const storedLabwareDefinitions = getStoredLabwareDefinitions(
    storedLabwareDetails ?? null,
    labwareEntities
  )
  const maxPoolCount =
    storedLabwareDetails != null &&
    storedLabwareDefinitions != null &&
    storedLabwareDefinitions.primaryLabwareDefinition != null
      ? getMaxPoolCount({
          labwareDefinitions: {
            primary: storedLabwareDefinitions?.primaryLabwareDefinition ?? null,
            adapter: storedLabwareDefinitions?.adapterLabwareDefinition ?? null,
            lid: storedLabwareDefinitions?.lidLabwareDefinition ?? null,
          },
          model,
        })
      : 0
  const isHopperFull = numLabwareInHopper === maxPoolCount
  const storedLabwareInfo =
    moduleState != null
      ? getStoredLabwareInfo(moduleState, labwareEntities)
      : null
  const isShuttleLabwareTiprack =
    labwareOnShuttle != null &&
    getIsTiprack(labwareEntities[labwareOnShuttle.primaryLabwareId]?.def)
  const showHopperContent =
    storedLabwareInfo != null &&
    labwareInHopper != null &&
    labwareInHopper.length > 0
  return (
    <div className={styles.tools_container}>
      <DropdownStepFormField
        options={flexStackerOptions}
        title={t('step_edit_form.flex_stacker.module')}
        {...propsForFields.moduleId}
        tooltipContent={null}
        onEnter={(id: string) => {
          dispatch(hoverSelection({ id, text: t('application:select') }))
        }}
        onExit={() => {
          dispatch(hoverSelection({ id: null, text: null }))
        }}
      />
      <Divider marginY="0" />
      <div className={styles.shuttle_stacker_container}>
        <div className={styles.title_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('step_edit_form.flex_stacker.stacker')}
          </StyledText>
          {showHopperContent ? (
            <Chip
              text={
                isHopperFull
                  ? t('step_edit_form.flex_stacker.hopper.full')
                  : t('step_edit_form.flex_stacker.hopper.labware_filled', {
                      amount: numLabwareInHopper,
                      total: maxPoolCount,
                    })
              }
              type={isHopperFull ? 'warning' : 'info'}
              hasIcon={false}
            />
          ) : null}
        </div>
        {showHopperContent ? (
          <StackerContentItem
            primaryLabwareName={storedLabwareInfo.primaryText}
            hasLid={storedLabwareInfo.hasLid}
            isTiprack={storedLabwareInfo.isTiprack}
            quantity={numLabwareInHopper}
          />
        ) : (
          <InfoScreen
            content={t('step_edit_form.flex_stacker.no_labware_on_stacker')}
          />
        )}
      </div>
      <Divider marginY="0" />
      <div className={styles.shuttle_stacker_container}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('step_edit_form.flex_stacker.shuttle')}
        </StyledText>
        {labwareOnShuttle != null ? (
          <StackerContentItem
            primaryLabwareName={
              nicknamesById[labwareOnShuttle.primaryLabwareId] ??
              labwareEntities[labwareOnShuttle.primaryLabwareId]?.def.metadata
                .displayName
            }
            hasLid={labwareOnShuttle.lidLabwareId != null}
            isTiprack={isShuttleLabwareTiprack}
          />
        ) : (
          <InfoScreen
            content={t('step_edit_form.flex_stacker.no_labware_on_shuttle')}
          />
        )}
      </div>
      <Divider marginY="0" />
      {moduleState != null ? (
        <StackerControls
          formData={formData}
          propsForFields={propsForFields}
          isStackerStoreEnabled={isStackerStoreEnabled}
          isStackerRetrieveEnabled={isStackerRetrieveEnabled}
          isStackerEmptyEnabled={isStackerEmptyEnabled}
        />
      ) : null}
      {formData.flexStackerFormType !== FLEX_STACKER_STORE &&
      formData.flexStackerFormType != null ? (
        <Divider marginY="0" />
      ) : null}
      {formData.flexStackerFormType === FLEX_STACKER_FILL ? (
        <RefillSettings
          formData={formData}
          propsForFields={propsForFields}
          moduleState={moduleState}
          maxPoolCount={maxPoolCount}
          isStackerFillEnabled={isStackerFillEnabled}
          showFormErrors={showFormErrors}
        />
      ) : null}
      {formData.flexStackerFormType === FLEX_STACKER_EMPTY ? (
        <EmptySettings propsForFields={propsForFields} />
      ) : null}
    </div>
  )
}
