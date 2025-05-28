import { css } from 'styled-components'

import { Btn, COLORS, Flex, Icon, JUSTIFY_CENTER } from '@opentrons/components'

const BUTTON_NAME = 'SettingsIconButton'

export const SettingsButton = (props: { onClick: () => void }): JSX.Element => {
  const { onClick } = props
  return (
    <Btn
      onClick={onClick}
      css={GEAR_ICON_STYLE}
      data-testid={BUTTON_NAME}
      aria-label={BUTTON_NAME}
    >
      <Flex justifyContent={JUSTIFY_CENTER}>
        <Icon size="1rem" name="gear" />
      </Flex>
    </Btn>
  )
}

const GEAR_ICON_STYLE = css`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: ${COLORS.grey60};

  &:hover {
    background-color: ${COLORS.grey30};
  }

  &:active {
    color: ${COLORS.grey60};
    background-color: ${COLORS.grey35};
  }

  &:focus-visible {
    position: relative;
    outline: none;

    /* blue ring */
    &::after {
      content: '';
      position: absolute;
      top: -0.5rem;
      left: -0.5rem;
      right: -0.5rem;
      bottom: -0.5rem;

      border: 3px solid ${COLORS.blue50};
      border-radius: 50%;
      pointer-events: none;
      box-sizing: content-box;
    }
    background-color: ${COLORS.grey35};
  }
`
