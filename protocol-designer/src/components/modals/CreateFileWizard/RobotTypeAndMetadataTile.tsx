import * as React from 'react'
import styled, {css} from 'styled-components'
import {  DIRECTION_COLUMN, Flex, Text, SPACING, BORDERS, TYPOGRAPHY, RadioGroup } from '@opentrons/components'
import { i18n } from '../../../localization'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { FormikProps } from 'formik'
import { InputField } from './InputField'

import type { FormState } from './types'

const ROBOT_TYPE_OPTIONS = [{ value: OT2_ROBOT_TYPE, name: 'OT2' }, { value: FLEX_ROBOT_TYPE, name: 'Opentrons Flex' }]

export function RobotTypeAndMetadataTile(props: FormikProps<FormState>): JSX.Element {
  const { handleChange, handleBlur, values } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} height='32rem' gridGap={SPACING.spacing32}>
      <Text as='h2'>
        {i18n.t('modal.create_file_wizard.protocol_name_and_description')}
      </Text>

      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <Text as='h4'>
          {i18n.t('modal.create_file_wizard.choose_robot_type_and_protocol_name')}
        </Text>
        <Flex flexDirection={DIRECTION_COLUMN} width="10rem" gridGap={SPACING.spacing4}>
          <Text as="p">
            {i18n.t('modal.create_file_wizard.robot_type')}
          </Text>
          <RadioGroup 
            useBlueChecked
            name="fields.robotType"
            css={css`
              ${TYPOGRAPHY.pRegular}
              line-height: ${TYPOGRAPHY.lineHeight20};
            `}
            value={values.fields.robotType}
            onChange={handleChange}
            options={ROBOT_TYPE_OPTIONS}
          />
        </Flex>
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
