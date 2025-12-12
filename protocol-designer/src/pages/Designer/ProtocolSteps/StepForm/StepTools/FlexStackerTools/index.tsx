import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Chip,
  Divider,
  InfoScreen,
  ListItem,
  StyledText,
  Tag,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_V1, getMaxPoolCount } from '@opentrons/shared-data'
import { flexStackerStateGetter } from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import {
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_STORE,
} from '/protocol-designer/constants'
import {
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
import { StackerControls } from './StackerControls'
import { getStoredLabwareDefinitions } from './utils.ts/getStoredLabwareDefinitions'
import { getStoredLabwareInfo } from './utils.ts/getStoredLabwareInfo'

import type { StepFormProps } from '../../types'

export function FlexStackerTools(props: StepFormProps): JSX.Element {
  const { formData, propsForFields } = props
  const { t } = useTranslation('form')
  const dispatch = useDispatch()

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
          {storedLabwareDetails != null ? (
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
        {storedLabwareInfo != null ? (
          <ListItem type="default" className={styles.list_item}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {storedLabwareInfo.primaryText}
            </StyledText>
            {storedLabwareInfo.hasLid ? (
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('step_edit_form.flex_stacker.with_tiprack_lid')}
              </StyledText>
            ) : null}
            <Tag
              text={t('step_edit_form.flex_stacker.quantity', {
                count: numLabwareInHopper,
              })}
              type="default"
              shrinkToContent
            />
          </ListItem>
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
          <ListItem type="default" className={styles.list_item}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {nicknamesById[labwareOnShuttle.primaryLabwareId] ??
                labwareEntities[labwareOnShuttle.primaryLabwareId]?.def.metadata
                  .displayName}
            </StyledText>
          </ListItem>
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
          moduleState={moduleState}
          labwareEntities={labwareEntities}
        />
      ) : null}
      {formData.flexStackerFormType !== FLEX_STACKER_STORE &&
      formData.flexStackerFormType != null ? (
        <Divider marginY="0" />
      ) : null}
      {formData.flexStackerFormType === FLEX_STACKER_FILL ? (
        <RefillSettings
          propsForFields={propsForFields}
          moduleState={moduleState}
        />
      ) : null}
      {formData.flexStackerFormType === FLEX_STACKER_EMPTY ? (
        <EmptySettings propsForFields={propsForFields} />
      ) : null}
    </div>
  )
}
