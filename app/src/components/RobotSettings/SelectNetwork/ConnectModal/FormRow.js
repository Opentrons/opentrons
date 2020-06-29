// @flow
// presentational components for the wifi connect form
import { FONT_WEIGHT_SEMIBOLD } from '@opentrons/components'
import * as React from 'react'
import type { StyledComponent } from 'styled-components'
import styled from 'styled-components'

export type FormRowProps = {|
  label: string,
  labelFor: string,
  children: React.Node,
|}

const StyledRow: StyledComponent<{||}, {||}, HTMLDivElement> = styled.div`
  display: table-row;
`

const StyledLabel: StyledComponent<{||}, {||}, HTMLLabelElement> = styled.label`
  display: table-cell;
  padding-right: 1rem;
  text-align: right;
  font-weight: ${FONT_WEIGHT_SEMIBOLD};
`

const StyledInputWrapper: StyledComponent<
  {||},
  {||},
  HTMLDivElement
> = styled.div`
  padding-bottom: 0.75rem;
  display: table-cell;

  & > *:not(:last-child) {
    margin-bottom: 0.25rem;
  }
`

export const FormRow = (props: FormRowProps): React.Node => {
  const { label, labelFor, children } = props

  return (
    <StyledRow>
      <StyledLabel htmlFor={labelFor}>{label}</StyledLabel>
      <StyledInputWrapper>{children}</StyledInputWrapper>
    </StyledRow>
  )
}
