import { forwardRef } from 'react'
import clsx from 'clsx'

import { Flex, RobotCoordsForeignDiv, StyledText } from '@opentrons/components'

import styles from './pipettelabel.module.css'

import type { ForwardedRef, ReactNode } from 'react'
import type { LabelPlacement } from '../../types'

export interface PipetteLabelProps {
  text: string
  x: number
  y: number
  placement: LabelPlacement
  isZoomed: boolean
  isError: boolean
}

function PipetteLabelComponent(
  { text, isZoomed, isError, x, y, placement }: PipetteLabelProps,
  ref: ForwardedRef<HTMLDivElement>
): ReactNode {
  return (
    <RobotCoordsForeignDiv
      x={x}
      y={y}
      innerDivProps={{
        transform: `rotate(180deg) scaleX(-1)`,
      }}
    >
      <Flex
        ref={ref}
        fontSize={isZoomed ? '5px' : '13px'}
        className={clsx(styles.pipette_label_base, {
          [styles[`pipette_label_${placement}`]]: placement,
          [styles.pipette_label_accessible]: !isError,
          [styles.pipette_label_inaccessible]: isError,
        })}
      >
        <StyledText>{text}</StyledText>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}

export const PipetteLabel = forwardRef<HTMLDivElement, PipetteLabelProps>(
  PipetteLabelComponent
)
