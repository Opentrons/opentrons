import * as React from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import without from 'lodash/without'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  PrimaryButton,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  useHoverTooltip,
  Tooltip,
  WRAP,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  getPipetteNameSpecs,
  PipetteName,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
  ModuleModel,
  getModuleDisplayName,
  getModuleType,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { getIsCrashablePipetteSelected } from '../../../step-forms'
import gripperImage from '../../../images/flex_gripper.png'
import wasteChuteImage from '../../../images/waste_chute.png'
import trashBinImage from '../../../images/flex_trash_bin.png'
import { i18n } from '../../../localization'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { CrashInfoBox, ModuleDiagram } from '../../modules'
import { ModuleFields } from '../FilePipettesModal/ModuleFields'
import { GoBack } from './GoBack'
import {
  getCrashableModuleSelected,
  getLastCheckedEquipment,
  getTrashBinOptionDisabled,
} from './utils'
import { EquipmentOption } from './EquipmentOption'
import { HandleEnter } from './HandleEnter'

import type { AdditionalEquipment, WizardTileProps } from './types'

export const DEFAULT_SLOT_MAP: { [moduleModel in ModuleModel]?: string } = {
  [THERMOCYCLER_MODULE_V2]: 'B1',
  [HEATERSHAKER_MODULE_V1]: 'D1',
  [MAGNETIC_BLOCK_V1]: 'D2',
  [TEMPERATURE_MODULE_V2]: 'C1',
}
export const FLEX_SUPPORTED_MODULE_MODELS: ModuleModel[] = [
  THERMOCYCLER_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
]

export function ModulesAndOtherTile(props: WizardTileProps): JSX.Element {
  const {
    formState,
    getValues,
    setValue,
    goBack,
    proceed,
    control,
    trigger,
    watch,
  } = props
  const { fields, pipettesByMount, additionalEquipment } = getValues()
  const modulesByType = watch('modulesByType')
  const { errors, touchedFields } = formState
  const robotType = fields.robotType
  const moduleRestrictionsDisabled = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const [targetProps, tooltipProps] = useHoverTooltip()
  const hasATrash =
    robotType === FLEX_ROBOT_TYPE
      ? additionalEquipment.includes('wasteChute') ||
        additionalEquipment.includes('trashBin')
      : true

  const { left, right } = pipettesByMount

  const hasCrashableMagnetModuleSelected = getCrashableModuleSelected(
    modulesByType,
    MAGNETIC_MODULE_TYPE
  )
  const hasCrashableTemperatureModuleSelected = getCrashableModuleSelected(
    modulesByType,
    TEMPERATURE_MODULE_TYPE
  )
  const hasHeaterShakerSelected = Boolean(
    modulesByType[HEATERSHAKER_MODULE_TYPE].onDeck
  )

  const showHeaterShakerPipetteCollisions =
    hasHeaterShakerSelected &&
    [
      getPipetteNameSpecs(left.pipetteName as PipetteName),
      getPipetteNameSpecs(right.pipetteName as PipetteName),
    ].some(pipetteSpecs => pipetteSpecs && pipetteSpecs.channels !== 1)

  const crashablePipetteSelected = getIsCrashablePipetteSelected(
    pipettesByMount
  )
  const modCrashWarning = (
    <CrashInfoBox
      showDiagram
      showMagPipetteCollisons={
        crashablePipetteSelected && hasCrashableMagnetModuleSelected
      }
      showTempPipetteCollisons={
        crashablePipetteSelected && hasCrashableTemperatureModuleSelected
      }
      showHeaterShakerLabwareCollisions={hasHeaterShakerSelected}
      showHeaterShakerModuleCollisions={hasHeaterShakerSelected}
      showHeaterShakerPipetteCollisions={showHeaterShakerPipetteCollisions}
    />
  )

  return (
    <HandleEnter disabled={!hasATrash} onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          minHeight="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">
            {i18n.t('modal.create_file_wizard.choose_additional_items')}
          </Text>
          {robotType === OT2_ROBOT_TYPE ? (
            <ModuleFields
              // @ts-expect-error
              errors={errors?.modulesByType ?? null}
              values={modulesByType}
              onSetFieldValue={setValue}
              // @ts-expect-error
              touched={touchedFields.modulesByType ?? null}
              control={control}
              trigger={trigger}
            />
          ) : (
            <FlexModuleFields {...props} />
          )}
          {robotType === OT2_ROBOT_TYPE && moduleRestrictionsDisabled !== true
            ? modCrashWarning
            : null}
        </Flex>

        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBack
            onClick={() => {
              if (robotType === OT2_ROBOT_TYPE) {
                if (pipettesByMount.right.pipetteName === '') {
                  goBack(2)
                } else {
                  goBack(1)
                }
              } else {
                goBack()
              }
            }}
          />
          <PrimaryButton
            onClick={() => proceed()}
            disabled={!hasATrash}
            {...targetProps}
          >
            {i18n.t('modal.create_file_wizard.review_file_details')}
          </PrimaryButton>
          {!hasATrash ? (
            <Tooltip {...tooltipProps}>
              {i18n.t(`tooltip.disabled_no_trash`)}
            </Tooltip>
          ) : null}
        </Flex>
      </Flex>
    </HandleEnter>
  )
}

function FlexModuleFields(props: WizardTileProps): JSX.Element {
  const { getValues, watch, setValue } = props
  const { fields } = getValues()
  const modulesByType = watch('modulesByType')
  const additionalEquipment = watch('additionalEquipment')
  const isFlex = fields.robotType === FLEX_ROBOT_TYPE
  const trashBinDisabled = getTrashBinOptionDisabled({
    additionalEquipment,
    modulesByType,
  })

  const handleSetEquipmentOption = (equipment: AdditionalEquipment): void => {
    if (additionalEquipment.includes(equipment)) {
      setValue('additionalEquipment', without(additionalEquipment, equipment))
    } else {
      setValue('additionalEquipment', [...additionalEquipment, equipment])
    }
  }

  React.useEffect(() => {
    if (trashBinDisabled) {
      setValue('additionalEquipment', without(additionalEquipment, 'trashBin'))
    }
  }, [trashBinDisabled, setValue])

  return (
    <Flex flexWrap={WRAP} gridGap={SPACING.spacing4} alignSelf={ALIGN_CENTER}>
      {FLEX_SUPPORTED_MODULE_MODELS.map(moduleModel => {
        const moduleType = getModuleType(moduleModel)
        return (
          <EquipmentOption
            key={moduleModel}
            isSelected={modulesByType[moduleType].onDeck}
            image={<ModuleDiagram type={moduleType} model={moduleModel} />}
            text={getModuleDisplayName(moduleModel)}
            disabled={
              getLastCheckedEquipment({
                additionalEquipment,
                modulesByType,
              }) === moduleType
            }
            onClick={() => {
              if (modulesByType[moduleType].onDeck) {
                setValue(`modulesByType.${moduleType}.onDeck`, false)
                setValue(`modulesByType.${moduleType}.model`, null)
                setValue(`modulesByType.${moduleType}.slot`, '')
              } else {
                setValue(`modulesByType.${moduleType}.onDeck`, true)
                setValue(`modulesByType.${moduleType}.model`, moduleModel)
                setValue(
                  `modulesByType.${moduleType}.slot`,
                  DEFAULT_SLOT_MAP[moduleModel] ?? ''
                )
              }
            }}
            showCheckbox
          />
        )
      })}
      <EquipmentOption
        onClick={() => handleSetEquipmentOption('gripper')}
        isSelected={additionalEquipment.includes('gripper')}
        image={
          <AdditionalItemImage
            src={gripperImage}
            alt="Opentrons Flex Gripper"
          />
        }
        text="Gripper"
        showCheckbox
      />
      {isFlex ? (
        <>
          <EquipmentOption
            onClick={() => handleSetEquipmentOption('wasteChute')}
            isSelected={additionalEquipment.includes('wasteChute')}
            image={
              <AdditionalItemImage
                src={wasteChuteImage}
                alt="Opentrons Waste Chute"
              />
            }
            text="Waste Chute"
            showCheckbox
          />
          <EquipmentOption
            onClick={() => handleSetEquipmentOption('trashBin')}
            isSelected={additionalEquipment.includes('trashBin')}
            image={
              <AdditionalItemImage
                src={trashBinImage}
                alt="Opentrons Trash Bin"
              />
            }
            text="Trash Bin"
            showCheckbox
            disabled={trashBinDisabled}
          />
        </>
      ) : null}
    </Flex>
  )
}

const AdditionalItemImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
