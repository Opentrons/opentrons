// @flow
// more flexible replacement component for LabeledControl
// good for adding a labeled section to a Card or similar wrapper
import * as React from 'react'
import styled from 'styled-components'

import { FONT_BODY_1_DARK, FONT_WEIGHT_SEMIBOLD } from '../styles'

import type { StyledComponent } from 'styled-components'

export type InfoSectionProps = {|
  title: string,
  children?: React.Node,
|}

const SectionWrapper: StyledComponent<{||}, {||}, HTMLDivElement> = styled.div`
  width: 100%;
  padding: 1rem;
  ${FONT_BODY_1_DARK};
`

const SectionTitle: StyledComponent<{||}, {||}, HTMLElement> = styled.p`
  font-weight: ${FONT_WEIGHT_SEMIBOLD};
  margin-bottom: 0.5rem;
`

export const ControlSection = (props: InfoSectionProps) => (
  <SectionWrapper {...props}>
    <SectionTitle>{props.title}</SectionTitle>
    {props.children}
  </SectionWrapper>
)
