import * as React from 'react'
import styled from 'styled-components'
import {  DIRECTION_COLUMN, Flex, Text, SPACING, BORDERS, TYPOGRAPHY, RadioGroup } from '@opentrons/components'
import { i18n } from '../../../localization'
import { FormikProps } from 'formik'
import { InputField } from './InputField'

import type { FormState } from './types'

export function MetadataTile(props: FormikProps<FormState>): JSX.Element {
  const { handleChange, handleBlur, values } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} height='32rem' gridGap={SPACING.spacing32}>
      <Text as='h2'>
        {i18n.t('modal.create_file_wizard.protocol_name_and_description')}
      </Text>

      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <Text as='h4'>
          {i18n.t('modal.create_file_wizard.name_your_protocol')}
        </Text>
        <Flex flexDirection={DIRECTION_COLUMN} width="20rem" gridGap={SPACING.spacing4}>
          <Text as="p">
            {i18n.t('modal.create_file_wizard.protocol_name')}
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
          {i18n.t('modal.create_file_wizard.add_optional_info')}
        </Text>
        <Flex flexDirection={DIRECTION_COLUMN} width="30rem" gridGap={SPACING.spacing4}>
          <Text as="p">
            {i18n.t('modal.create_file_wizard.description')}
          </Text>
          <DescriptionField 
            value={values.fields.description ?? ''}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} width="30rem" gridGap={SPACING.spacing4}>
          <Text as="p">
            {i18n.t('modal.create_file_wizard.organization_or_author')}
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
