import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DIRECTION_COLUMN, Flex, Text, SPACING, SecondaryButton, PrimaryButton, ALIGN_CENTER, JUSTIFY_SPACE_BETWEEN } from '@opentrons/components'

import {
  FormModulesByType,
  getIsCrashablePipetteSelected,
} from '../../../step-forms'
import { CrashInfoBox, isModuleWithCollisionIssue } from '../../modules'
import { selectors as featureFlagSelectors } from '../../../feature-flags'

import { ModuleFields } from '../FilePipettesModal/ModuleFields'
import { HEATERSHAKER_MODULE_TYPE, MAGNETIC_MODULE_TYPE, ModuleType, TEMPERATURE_MODULE_TYPE, getPipetteNameSpecs, PipetteName } from '@opentrons/shared-data'
import type { WizardTileProps } from './types'
import { GoBackLink } from './GoBackLink'

const getCrashableModuleSelected = (
  modules: FormModulesByType,
  moduleType: ModuleType
): boolean => {
  const formModule = modules[moduleType]
  const crashableModuleOnDeck =
    formModule?.onDeck && formModule?.model
      ? isModuleWithCollisionIssue(formModule.model)
      : false

  return crashableModuleOnDeck
}
export function ModulesAndOtherTile(props: WizardTileProps): JSX.Element {
  const {
    handleChange,
    handleBlur,
    values,
    setFieldValue,
    errors,
    touched,
    setFieldTouched,
    goBack,
    proceed
  } = props
  const { i18n, t } = useTranslation()
  const moduleRestrictionsDisabled = useSelector(featureFlagSelectors.getDisableModuleRestrictions)

  const { left, right } = values.pipettesByMount

  const hasCrashableMagnetModuleSelected = getCrashableModuleSelected(
    values.modulesByType,
    MAGNETIC_MODULE_TYPE
  )
  const hasCrashableTemperatureModuleSelected = getCrashableModuleSelected(
    values.modulesByType,
    TEMPERATURE_MODULE_TYPE
  )
  const hasHeaterShakerSelected = Boolean(
    values.modulesByType[HEATERSHAKER_MODULE_TYPE].onDeck
  )

  const showHeaterShakerPipetteCollisions =
    hasHeaterShakerSelected &&
    [
      getPipetteNameSpecs(left.pipetteName as PipetteName),
      getPipetteNameSpecs(right.pipetteName as PipetteName),
    ].some(
      pipetteSpecs =>
        pipetteSpecs && pipetteSpecs.channels !== 1
    )

  const crashablePipetteSelected = getIsCrashablePipetteSelected(values.pipettesByMount)
  const modCrashWarning = (
    <CrashInfoBox
      showDiagram
      showMagPipetteCollisons={crashablePipetteSelected && hasCrashableMagnetModuleSelected}
      showTempPipetteCollisons={crashablePipetteSelected && hasCrashableTemperatureModuleSelected}
      showHeaterShakerLabwareCollisions={hasHeaterShakerSelected}
      showHeaterShakerModuleCollisions={hasHeaterShakerSelected}
      showHeaterShakerPipetteCollisions={showHeaterShakerPipetteCollisions}
    />
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
      <Flex flexDirection={DIRECTION_COLUMN} minHeight='26rem' gridGap={SPACING.spacing32}>
        <Text as='h2'>
          {t('modal.create_file_wizard.additional_items')}
        </Text>
        <ModuleFields
          errors={errors.modulesByType ?? null}
          values={values.modulesByType}
          onFieldChange={handleChange}
          onSetFieldValue={setFieldValue}
          onBlur={handleBlur}
          touched={touched.modulesByType ?? null}
          onSetFieldTouched={setFieldTouched}
        />
        {moduleRestrictionsDisabled !== true ? modCrashWarning : null}
      </Flex >

      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <GoBackLink onClick={goBack}/>
        <PrimaryButton onClick={proceed}>{t('modal.create_file_wizard.create_protocol_on_to_liquids')}</PrimaryButton>
      </Flex>
    </Flex>
  )
}