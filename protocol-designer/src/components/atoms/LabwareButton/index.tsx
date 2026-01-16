import { useState } from 'react'
import clsx from 'clsx'
import { LabwareCardOverflowMenu } from 'protocol-designer/src/components/organisms/LabwareCardOverflowMenu'

import {
  Box,
  COLORS,
  OverflowBtn,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  StyledText,
  Tag,
} from '@opentrons/components'

import styles from './labwarebutton.module.css'

import type { MouseEvent } from 'react'

interface LabwareButtonProps {
  numberInStack: number
  displayName: string
  isSelected: boolean
  onClick: (
    labwareId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void
  id: string
}
export function LabwareButton(props: LabwareButtonProps): JSX.Element {
  const { isSelected, onClick, numberInStack, displayName, id } = props
  //  The tagHover is annoying to keep track of state locally in this Ts component
  //  but no other way to put it in css modules since its a tag prop
  const [tagHover, setTagHover] = useState<boolean>(false)
  const [showOverflowMenu, setShowOverflowMenu] = useState<boolean>(false)
  return (
    <button
      data-testid={`LabwareButton-${numberInStack}`}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick(id, event)
      }}
      className={clsx(styles.button, { [styles.button_active]: isSelected })}
    >
      <div
        className={styles.button_container}
        onMouseEnter={() => {
          setTagHover(true)
        }}
        onMouseLeave={() => {
          setTagHover(false)
        }}
      >
        <Tag
          type={isSelected || tagHover ? 'onColor' : 'default'}
          text={numberInStack.toString()}
          shrinkToContent
        />
        <StyledText desktopStyle="bodyDefaultRegular">{displayName}</StyledText>

        {isSelected ? (
          <Box position={POSITION_RELATIVE}>
            <OverflowBtn
              data-testid="LabwareCard_overflowBtn"
              onClick={() => {
                setShowOverflowMenu(true)
              }}
              fillColor={COLORS.white}
            />
            {showOverflowMenu ? (
              <Box position={POSITION_ABSOLUTE} left="3rem" top="-4px">
                <LabwareCardOverflowMenu
                  labwareIds={[id]}
                  setShowOverflowMenu={setShowOverflowMenu}
                />
              </Box>
            ) : null}
          </Box>
        ) : null}
      </div>
    </button>
  )
}
