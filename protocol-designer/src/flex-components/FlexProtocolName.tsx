/* eslint-disable react/prop-types */
import * as React from 'react'
import { FormGroup, InputField } from '@opentrons/components'
import { i18n } from '../localization'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'

function FlexProtocolNameComponent(formProps: any): JSX.Element {
  const { formProps: props } = formProps

  return (
    <>
      <StyledText as="h2">
        {i18n.t('flex.name_and_description.heading')}
      </StyledText>
      <div className={styles.flex_sub_heading}>
        <StyledText as="h5">
          {i18n.t('flex.name_and_description.choose_name')}
        </StyledText>
      </div>

      <FormGroup className={styles.form_group}>
        <StyledText as="p">
          {i18n.t('flex.name_and_description.protocol_name')}
        </StyledText>
        <InputField
          autoFocus
          tabIndex={1}
          type="text"
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndName}
          name="fields.pndName"
        />
        <StyledText as="label">
          {i18n.t('flex.name_and_description.supporting_error_text')}
        </StyledText>
      </FormGroup>

      <div className={styles.flex_sub_heading}>
        <StyledText as="h5">
          {i18n.t('flex.name_and_description.add_more_information')}
        </StyledText>
      </div>

      <FormGroup className={styles.form_group}>
        <StyledText as="p">
          {i18n.t('flex.name_and_description.organization_author')}
        </StyledText>
        <InputField
          tabIndex={2}
          type="text"
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndOrgAuthor}
          name="fields.pndOrgAuthor"
        />
        <StyledText as="label">
          {i18n.t('flex.name_and_description.supporting_error_text')}
        </StyledText>
      </FormGroup>

      <FormGroup className={styles.form_group}>
        <StyledText as="p">
          {i18n.t('flex.name_and_description.protocol_description')}
        </StyledText>
        <textarea
          tabIndex={3}
          className={styles.textarea_input}
          rows={4}
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndDescription}
          name="fields.pndDescription"
        />
        <StyledText as="label">
          {i18n.t('flex.name_and_description.supporting_error_text')}
        </StyledText>
      </FormGroup>
    </>
  )
}

export const FlexProtocolName = FlexProtocolNameComponent
