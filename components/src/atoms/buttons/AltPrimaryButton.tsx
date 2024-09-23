import styled from 'styled-components'

import { COLORS } from '../../helix-design-system'
import { styleProps } from '../../primitives'
import { PrimaryButton } from '../..'

export const AltPrimaryButton = styled(PrimaryButton)`
  background-color: ${COLORS.grey30};
  color: ${COLORS.black90};

  ${styleProps}

  &:focus {
    background-color: ${COLORS.grey35};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.grey40};
  }

  &:hover {
    box-shadow: 0 0 0;
    background-color: ${COLORS.grey35};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
