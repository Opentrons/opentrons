import { COLORS, StyledText, Tag } from '@opentrons/components'

interface LabwareButtonProps {
  numberInStack: number
  displayName: string
  isSelected: boolean
  onClick: (labwareId: string) => void
  id: string
}
export function LabwareButton(props: LabwareButtonProps): JSX.Element {
  const { isSelected, onClick, numberInStack, displayName, id } = props
  return (
    <button
      onClick={() => {
        onClick(id)
      }}
      style={{
        border: 'none',
        borderRadius: '8px',
        backgroundColor: isSelected ? COLORS.blue50 : COLORS.blue30,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        <Tag
          type={isSelected ? 'onColor' : 'default'}
          text={numberInStack.toString()}
          shrinkToContent
        />
        <StyledText
          desktopStyle="bodyDefaultRegular"
          color={isSelected ? COLORS.white : COLORS.black90}
        >
          {displayName}
        </StyledText>
      </div>
    </button>
  )
}
