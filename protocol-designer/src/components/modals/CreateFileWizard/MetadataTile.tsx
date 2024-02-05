import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  BORDERS,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  PrimaryButton,
} from '@opentrons/components'
import { InputField } from './InputField'
import { GoBack } from './GoBack'
import { HandleEnter } from './HandleEnter'

import type { WizardTileProps } from './types'

export function MetadataTile(props: WizardTileProps): JSX.Element {
  const { t } = useTranslation(['modal', 'application'])
  const { formState, goBack, proceed, register, watch } = props
  const fields = watch('fields')
  const name = fields.name

  const { errors, touchedFields } = formState

  const disableProceed = name == null || name === ''

  return (
    <HandleEnter onEnter={proceed} disabled={disableProceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          height="26rem"
          gridGap={SPACING.spacing24}
        >
          <Text as="h2">{t('protocol_name_and_description')}</Text>

          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <Text as="h4">{t('name_your_protocol')}</Text>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              width="20rem"
              minHeight="74px" // leave room for error if present
              gridGap={SPACING.spacing4}
            >
              <Text as="p" fontSize={TYPOGRAPHY.fontSizeP}>
                {`${t('protocol_name')} *`}
              </Text>
              <InputField
                id="MetadataTile_protocolName"
                autoFocus
                register={register}
                fieldName="fields.name"
                error={
                  //  TODO(jr, 2/1/24): wire up errors for this field
                  //  need to wire it up in the parent component
                  touchedFields?.fields?.name && name && name.length > 1
                    ? errors?.fields?.name?.message ?? null
                    : null
                }
              />
            </Flex>
          </Flex>

          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <Text as="h4">{t('add_optional_info')}</Text>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              width="30rem"
              gridGap={SPACING.spacing4}
            >
              <Text as="p" fontSize={TYPOGRAPHY.fontSizeP}>
                {t('description')}
              </Text>
              <DescriptionField
                aira-label="MetadataTile_descriptionField"
                {...register('fields.description')}
              />
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              width="30rem"
              gridGap={SPACING.spacing4}
            >
              <Text as="p" fontSize={TYPOGRAPHY.fontSizeP}>
                {t('organization_or_author')}
              </Text>
              <InputField
                aria-label="MetadataTile_orgOrAuth"
                fieldName="fields.organizationOrAuthor"
                register={register}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBack onClick={() => goBack()} />
          <PrimaryButton onClick={() => proceed()} disabled={disableProceed}>
            {t('application:next')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}

const DescriptionField = styled.textarea`
  min-height: 5rem;
  width: 100%;
  border: ${BORDERS.lineBorder};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing8};
  font-size: ${TYPOGRAPHY.fontSizeP};
  resize: none;
`
