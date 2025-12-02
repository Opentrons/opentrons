import { StyledText } from '../../atoms'
import { SPACING } from '../../ui-style-constants'

type LabwareDetailsWithCountProps = {
  title: string
  subTitle?: string
  quantity?: string | null
}

export function LabwareDetailsWithCount({
  title,
  subTitle,
  quantity,
}: LabwareDetailsWithCountProps): JSX.Element {
  return (
    <div
      style={{
        width: '318px',
        backgroundColor: 'var(--grey-20)',
        borderRadius: 'var(--border-radius-4)',
        padding: 'var(--spacing-16) var(--spacing-8)',
      }}
    >
      <StyledText desktopStyle="bodyDefaultRegular">{title}</StyledText>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.spacing16,
          width: '100%',
          color: 'var(--grey-60)',
        }}
      >
        <StyledText desktopStyle="bodyDefaultRegular">{subTitle}</StyledText>
      </div>
      {quantity != null ? (
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          backgroundColor="var(--transparent-black-80)"
          padding="2px 8px"
          width="88px"
          borderRadius="var(--border-radius-4)"
        >
          {quantity}
        </StyledText>
      ) : null}
    </div>
  )
}
