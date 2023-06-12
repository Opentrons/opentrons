import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, Text, SPACING, SecondaryButton, PrimaryButton, ALIGN_CENTER, JUSTIFY_SPACE_BETWEEN } from '@opentrons/components'

import type { WizardTileProps } from './types'
import { ModuleFields } from '../FilePipettesModal/ModuleFields'

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
  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing16}>
      <Flex flexDirection={DIRECTION_COLUMN} height='26rem' gridGap={SPACING.spacing32}>

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
      </Flex >
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <SecondaryButton onClick={goBack}>{i18n.format(t('shared.go_back'), 'capitalize')}</SecondaryButton>
        <PrimaryButton onClick={proceed}>{t('modal.create_file_wizard.create_protocol_on_to_liquids')}</PrimaryButton>
      </Flex>
    </Flex>
  )
}