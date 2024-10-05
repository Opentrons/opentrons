import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  COLORS,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { stepIconsByType } from '../../../../form-types'
import type { StepType } from '../../../../form-types'

export interface AddStepOverflowButtonProps {
  onClick: () => void
  stepType: StepType
}

export function AddStepOverflowButton(
  props: AddStepOverflowButtonProps
): JSX.Element {
  const { onClick, stepType } = props
  const { t, i18n } = useTranslation(['tooltip', 'application'])
  //   TODO(ja): add or delete tooltips when designs are finalized
  //   const [targetProps, tooltipProps] = useHoverTooltip({
  //     placement: TOOLTIP_RIGHT,
  //   })
  //   const tooltipMessage = t(`step_description.${stepType}`)
  return (
    <>
      <MenuButton onClick={onClick}>
        <Icon name={stepIconsByType[stepType]} size="1rem" />
        <StyledText desktopStyle="bodyDefaultRegular">
          {i18n.format(
            t(`application:stepType.${stepType}`, stepType),
            'capitalize'
          )}
        </StyledText>
      </MenuButton>
      {/* <Tooltip tooltipProps={tooltipProps}>{tooltipMessage}</Tooltip> */}
    </>
  )
}

const MenuButton = styled.button`
  background-color: ${COLORS.transparent};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8};
  width: 100%;
  cursor: pointer;
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  border: none;
  border-radius: inherit;
  display: flex;
  &:hover {
    background-color: ${COLORS.blue10};
  }
  &:disabled {
    color: ${COLORS.grey40};
    cursor: auto;
  }
`
