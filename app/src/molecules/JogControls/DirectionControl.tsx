// jog controls component
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  Icon,
  HandleKeypress,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  BORDERS,
  COLORS,
  SIZE_AUTO,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  ALIGN_FLEX_START,
} from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { ControlContainer } from './ControlContainer'
import { HORIZONTAL_PLANE, VERTICAL_PLANE } from './constants'

import type { IconName } from '@opentrons/components'
import type { Jog, Plane, Sign, Bearing, Axis } from './types'

interface Control {
  bearing: Bearing
  keyName: string
  shiftKey: boolean
  column: number
  iconName: IconName
  axis: Axis
  sign: Sign
}
interface ControlsContents {
  controls: Control[]
  title: string
  subtitle: string
}

const CONTROLS_CONTENTS_BY_PLANE: Record<Plane, ControlsContents> = {
  [VERTICAL_PLANE]: {
    controls: [
      {
        keyName: 'ArrowUp',
        shiftKey: true,
        bearing: 'up',
        iconName: 'ot-arrow-up',
        axis: 'z',
        sign: 1,
        column: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: true,
        bearing: 'down',
        iconName: 'ot-arrow-down',
        axis: 'z',
        sign: -1,
        column: 1,
      },
    ],
    title: 'Z-axis',
    subtitle: 'Shift + Arrow keys',
  },
  [HORIZONTAL_PLANE]: {
    controls: [
      {
        keyName: 'ArrowLeft',
        shiftKey: false,
        bearing: 'left',
        iconName: 'ot-arrow-left',
        axis: 'x',
        sign: -1,
        column: 0,
      },
      {
        keyName: 'ArrowRight',
        shiftKey: false,
        bearing: 'right',
        iconName: 'ot-arrow-right',
        axis: 'x',
        sign: 1,
        column: 2,
      },
      {
        keyName: 'ArrowUp',
        shiftKey: false,
        bearing: 'back',
        iconName: 'ot-arrow-up',
        axis: 'y',
        sign: 1,
        column: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: false,
        bearing: 'forward',
        iconName: 'ot-arrow-down',
        axis: 'y',
        sign: -1,
        column: 1,
      },
    ],
    title: 'X- and Y-axis',
    subtitle: 'Arrow Keys',
  },
}

const DIRECTION_CONTROL_LAYOUT = css`
  display: flex;

  @media (max-width: 750px) {
    flex-direction: column;
  }
`

export const PRIMARY_BUTTON_STYLING = css`
  @media (max-width: 750px) {
    flex-direction: row;
  }

  button {
    background-color: ${COLORS.white};

    &:hover {
      background-color: ${COLORS.white};
      color: ${COLORS.black};
      box-shadow: 0 0 0;
      border: 1px ${COLORS.lightGreyHover} solid;
    }

    &:active {
      background-color: ${COLORS.white};
      color: ${COLORS.blueEnabled};
      border: 1px ${COLORS.blueEnabled} solid;
    }

    &:disabled {
      background-color: inherit;
      color: ${COLORS.errorDisabled};
    }
  }
`

export const ACTIVE_STYLE = css`
  background-color: ${COLORS.white};
  color: ${COLORS.blueEnabled};
  border: 1px ${COLORS.blueEnabled} solid;
`

export const DEFAULT_STYLE = css`
  background-color: ${COLORS.white};
`

interface DirectionControlProps {
  planes: Plane[]
  jog: Jog
  stepSize: number
  defaultPlane?: Plane
  buttonColor?: string
}

export function DirectionControl(props: DirectionControlProps): JSX.Element {
  const { planes, jog, stepSize, defaultPlane } = props
  const [currentPlane, setCurrentPlane] = React.useState<Plane>(
    defaultPlane ?? planes[0]
  )
  const { t } = useTranslation(['robot_calibration'])

  const handlePlane = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setCurrentPlane(event.currentTarget.value as Plane)
    event.currentTarget.blur()
  }

  return (
    <ControlContainer title={t('direction_controls')}>
      <Flex flexDirection={DIRECTION_ROW} css={DIRECTION_CONTROL_LAYOUT}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          css={PRIMARY_BUTTON_STYLING}
        >
          {planes.map((plane: Plane) => {
            const { title, subtitle } = CONTROLS_CONTENTS_BY_PLANE[plane]
            return (
              <Flex key={plane}>
                <PrimaryButton
                  title={plane}
                  css={currentPlane === plane ? ACTIVE_STYLE : DEFAULT_STYLE}
                  minWidth="9.81rem"
                  height="3.62rem"
                  backgroundColor={COLORS.white}
                  color={COLORS.black}
                  marginRight={SPACING.spacing4}
                  value={plane}
                  onClick={handlePlane}
                >
                  <Flex flexDirection={DIRECTION_ROW}>
                    <Icon
                      name={
                        plane === 'vertical'
                          ? 'vertical-plane'
                          : 'horizontal-plane'
                      }
                      width="1.2rem"
                      marginRight={SPACING.spacing3}
                    />
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      alignItems={ALIGN_FLEX_START}
                    >
                      {title}
                      <StyledText
                        color={COLORS.darkGreyEnabled}
                        css={TYPOGRAPHY.labelRegular}
                      >
                        {subtitle}
                      </StyledText>
                    </Flex>
                  </Flex>
                </PrimaryButton>
              </Flex>
            )
          })}
        </Flex>
        <HandleKeypress
          preventDefault
          handlers={[
            ...CONTROLS_CONTENTS_BY_PLANE.vertical.controls,
            ...CONTROLS_CONTENTS_BY_PLANE.horizontal.controls,
          ].map(({ keyName, shiftKey, axis, sign }) => ({
            key: keyName,
            shiftKey,
            onPress: () => {
              setCurrentPlane(shiftKey ? 'vertical' : 'horizontal')
              jog(axis, sign, stepSize)
            },
          }))}
        >
          <ArrowKeys plane={currentPlane} jog={jog} stepSize={stepSize} />
        </HandleKeypress>
      </Flex>
    </ControlContainer>
  )
}

interface ArrowKeysProps {
  plane: Plane
  jog: Jog
  stepSize: number
}

export const ArrowKeys = (props: ArrowKeysProps): JSX.Element => {
  const { plane, jog, stepSize } = props
  const controls = CONTROLS_CONTENTS_BY_PLANE[plane].controls

  const ARROW_BUTTON_STYLING = css`
    @media (max-width: 750px) {
      margin-top: 50px;
      margin-bottom: 50px;
      margin-left: auto;
    }

    color: ${COLORS.darkGreyEnabled};
    background-color: ${COLORS.white};

    &:hover {
      background-color: ${COLORS.white};
      color: ${COLORS.darkGreyHover};
      box-shadow: 0 0 0;
      border: 1px ${COLORS.lightGreyHover} solid;
    }

    &:active {
      background-color: ${COLORS.white};
      color: ${COLORS.darkGreyPressed};
      border: 1px ${COLORS.lightGreyHover} solid;
    }

    &:focus {
      background-color: ${COLORS.white};
    }

    &:disabled {
      background-color: inherit;
      color: ${COLORS.darkGreyDisabled};
    }
  `

  return (
    <Flex alignItems={ALIGN_CENTER}>
      {[...Array(3).keys()].map(col => (
        <Flex key={col} flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER} marginRight={col > 3 ? SPACING.spacing2 : 0}>
          {controls
            .filter(({ column }) => column === col)
            .map(({ bearing, iconName, axis, sign }, index) => (
              <PrimaryButton
                key={bearing}
                css={ARROW_BUTTON_STYLING}
                title={bearing}
                width="2.75rem"
                height="2.75rem"
                onClick={() => jog(axis, sign, stepSize)}
                display="flex"
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_CENTER}
                marginBottom={index > 1 ? SPACING.spacing2 : 0}
              >
                <Icon size="1.125rem" name={iconName} />
              </PrimaryButton>
            ))}
        </Flex>
      ))}
    </Flex>
  )
}
