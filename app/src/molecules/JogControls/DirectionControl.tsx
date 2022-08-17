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
  gridRow: number
  gridColumn: number
  iconName: IconName
  axis: Axis
  sign: Sign
  margin?: string
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
        gridRow: 1,
        gridColumn: 2,
        margin: '0 0 1rem 1rem',
        iconName: 'ot-arrow-up',
        axis: 'z',
        sign: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: true,
        bearing: 'down',
        gridRow: 2,
        gridColumn: 2,
        margin: '1rem 0 0 1rem',
        iconName: 'ot-arrow-down',
        axis: 'z',
        sign: -1,
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
        gridRow: 2,
        gridColumn: 1,
        margin: '0 1rem 2rem 0',
        iconName: 'ot-arrow-left',
        axis: 'x',
        sign: -1,
      },
      {
        keyName: 'ArrowRight',
        shiftKey: false,
        bearing: 'right',
        gridRow: 2,
        gridColumn: 3,
        margin: '0 0 2rem 2rem',
        iconName: 'ot-arrow-right',
        axis: 'x',
        sign: 1,
      },
      {
        keyName: 'ArrowUp',
        shiftKey: false,
        bearing: 'back',
        gridRow: 1,
        gridColumn: 2,
        margin: '0 0 1rem 1rem',
        iconName: 'ot-arrow-up',
        axis: 'y',
        sign: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: false,
        bearing: 'forward',
        gridRow: 2,
        gridColumn: 2,
        margin: '1rem 0 0 1rem',
        iconName: 'ot-arrow-down',
        axis: 'y',
        sign: -1,
      },
    ],
    title: 'X- and Y-axis',
    subtitle: 'Arrow Keys',
  },
}

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

  const DIRECTION_BUTTON_STYLING = css`
    button {
      background-color: white;

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

  const ACTIVE_STYLE = css`
    background-color: ${COLORS.white};
    color: ${COLORS.blueEnabled};
    border: 1px ${COLORS.blueEnabled} solid;
  `

  const DEFAULT_STYLE = css`
    background-color: ${COLORS.white};
  `

  const handlePlane = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setCurrentPlane(event.currentTarget.value as Plane)
    event.currentTarget.blur()
  }

  const handleShift = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
      setCurrentPlane('vertical')
    }
  }

  React.useEffect(() => {
    window.addEventListener('keydown', handleShift)

    return () => {
      window.removeEventListener('keydown', handleShift)
    }
  }, [])

  return (
    <ControlContainer title={t('direction_controls')}>
      <Flex flexDirection={DIRECTION_ROW}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          css={DIRECTION_BUTTON_STYLING}
        >
          {planes.map((plane: Plane) => {
            const { title, subtitle } = CONTROLS_CONTENTS_BY_PLANE[plane]
            return (
              <Flex key={plane}>
                <PrimaryButton
                  title={plane}
                  css={currentPlane === plane ? ACTIVE_STYLE : DEFAULT_STYLE}
                  minWidth="157px"
                  height="58px"
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
        {currentPlane === 'horizontal' ? (
          <ArrowKeys plane={'horizontal'} jog={jog} stepSize={stepSize} />
        ) : (
          <ArrowKeys plane={'vertical'} jog={jog} stepSize={stepSize} />
        )}
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
    button {
      background-color: white;

      &:hover {
        background-color: ${COLORS.white};
        color: ${COLORS.darkGreyHover};
        box-shadow: 0 0 0;
        border: 1px ${COLORS.lightGreyHover} solid;
      }

      &:active {
        background-color: ${COLORS.white};
        color: ${COLORS.darkGreyPressed};
        border: 1px #16212d40 solid;
      }

      &:focus {
        background-color: ${COLORS.white};
      }

      &:disabled {
        background-color: inherit;
        color: ${COLORS.darkGreyDisabled};
      }
    }
  `

  return (
    <HandleKeypress
      preventDefault
      handlers={controls.map(({ keyName, shiftKey, axis, sign }) => ({
        key: keyName,
        shiftKey,
        onPress: () => {
          jog(axis, sign, stepSize)
        },
      }))}
    >
      <Box
        css={ARROW_BUTTON_STYLING}
        display="grid"
        gridGap={SPACING.spacing1}
        gridTemplateRows="repeat(2, [row] 2rem)"
        gridTemplateColumns="repeat(3, [col] 2rem)"
        margin={SIZE_AUTO}
        paddingLeft={SPACING.spacing3}
      >
        {controls.map(
          ({ bearing, gridRow, gridColumn, margin, iconName, axis, sign }) => (
            <PrimaryButton
              key={bearing}
              backgroundColor={COLORS.white}
              color={COLORS.darkGreyEnabled}
              border={BORDERS.lineBorder}
              title={bearing}
              width={'2.75rem'}
              height={'2.75rem'}
              alignSelf={ALIGN_CENTER}
              padding={0}
              onClick={() => jog(axis, sign, stepSize)}
              {...{ gridRow, gridColumn, margin }}
            >
              <Flex
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_CENTER}
                width="100%"
              >
                <Icon size="1.5rem" name={iconName} />
              </Flex>
            </PrimaryButton>
          )
        )}
      </Box>
    </HandleKeypress>
  )
}
