import { useState } from 'react'
import clsx from 'clsx'

import { StyledText, Tag } from '@opentrons/components'

import styles from './labwarebutton.module.css'

interface LabwareButtonProps {
  numberInStack: number
  displayName: string
  isSelected: boolean
  onClick: (labwareId: string) => void
  id: string
}
export function LabwareButton(props: LabwareButtonProps): JSX.Element {
  const { isSelected, onClick, numberInStack, displayName, id } = props
  //  The tagHover is annoying to keep track of state locally in this Ts component
  //  but no other way to put it in css modules since its a tag prop
  const [tagHover, setTagHover] = useState<boolean>(false)

  return (
    <button
      data-testid={`LabwareButton-${numberInStack}`}
      onClick={() => {
        onClick(id)
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
      </div>
    </button>
  )
}
