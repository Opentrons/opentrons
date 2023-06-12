import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN,Flex, Text, SPACING, BORDERS, TYPOGRAPHY, JUSTIFY_SPACE_BETWEEN, ALIGN_CENTER, SecondaryButton, PrimaryButton} from '@opentrons/components'
import { InputField } from './InputField'

import type { WizardTileProps } from './types'

export function MetadataTile(props: WizardTileProps): JSX.Element {
  const { i18n, t } = useTranslation()
  const { handleChange, handleBlur, values, goBack, proceed } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing16}>
      <Flex flexDirection={DIRECTION_COLUMN} height='26rem' gridGap={SPACING.spacing32}>
        <Text as='h2'>
          {t('modal.create_file_wizard.protocol_name_and_description')}
        </Text>

        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <Text as='h4'>
            {t('modal.create_file_wizard.name_your_protocol')}
          </Text>
          <Flex flexDirection={DIRECTION_COLUMN} width="20rem" gridGap={SPACING.spacing4}>
            <Text as="p">
              {t('modal.create_file_wizard.protocol_name')}
            </Text>
            <InputField
              autoFocus
              name="fields.name"
              value={values.fields.name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </Flex>
        </Flex>

        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <Text as='h4'>
            {t('modal.create_file_wizard.add_optional_info')}
          </Text>
          <Flex flexDirection={DIRECTION_COLUMN} width="30rem" gridGap={SPACING.spacing4}>
            <Text as="p">
              {t('modal.create_file_wizard.description')}
            </Text>
            <DescriptionField
              value={values.fields.description ?? ''}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} width="30rem" gridGap={SPACING.spacing4}>
            <Text as="p">
              {t('modal.create_file_wizard.organization_or_author')}
            </Text>
            <InputField
              name="fields.organizationOrAuthor"
              value={values.fields.organizationOrAuthor}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </Flex>
        </Flex>
      </Flex>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <SecondaryButton onClick={goBack}>{i18n.format(t('shared.go_back'), 'capitalize')}</SecondaryButton>
        <PrimaryButton onClick={proceed}>{i18n.format(t('shared.next'), 'capitalize')}</PrimaryButton>
      </Flex>
    </Flex>
  )
}

const DescriptionField = styled.textarea`
  min-height: 5rem;
  width: 100%;
  background-color: #f8f8f8;
  border: ${BORDERS.lineBorder};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing8};
  font-size: ${TYPOGRAPHY.fontSizeP};
  resize: none;
`
