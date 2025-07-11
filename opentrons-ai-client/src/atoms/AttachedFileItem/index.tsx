import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getFileType } from '/ai-client/resources/utils/fileUtils'

interface AttachedFileItemProps {
  file: {
    name: string
    size?: number
  }
  onRemove?: () => void
  showRemoveButton?: boolean
}

// Helper to get simple file type labels
const getSimpleFileTypeLabel = (type: string, fileName: string): string => {
  // Check for Python files first
  if (fileName.toLowerCase().endsWith('.py')) {
    return 'Python file'
  }

  switch (type) {
    case 'pdf':
      return 'PDF file'
    case 'csv':
      return 'CSV file'
    case 'image':
      return 'Image file'
    case 'json':
      return 'JSON file'
    default:
      return 'File'
  }
}

// Helper to get file extension for display in the icon container
const getFileExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? `.${extension}` : '.file'
}

export function AttachedFileItem({
  file,
  onRemove,
  showRemoveButton = true,
}: AttachedFileItemProps): JSX.Element {
  const fileType = getFileType(file as File)

  return (
    <AttachedFileItemContainer
      $showRemoveButton={showRemoveButton && !!onRemove}
    >
      <FileIconContainer>
        <FileExtension>{getFileExtension(file.name)}</FileExtension>
      </FileIconContainer>
      <FileDetailsContainer>
        <FileName>{file.name}</FileName>
        <FileDetails>{getSimpleFileTypeLabel(fileType, file.name)}</FileDetails>
      </FileDetailsContainer>
      {showRemoveButton && onRemove && (
        <RemoveFileButton onClick={onRemove} aria-label={`Remove ${file.name}`}>
          <Icon name="close" size="1.75rem" color={COLORS.grey60} />
        </RemoveFileButton>
      )}
    </AttachedFileItemContainer>
  )
}

const AttachedFileItemContainer = styled.div<{ $showRemoveButton: boolean }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: ${SPACING.spacing8};
  padding: ${SPACING.spacing8};
  padding-right: ${props =>
    props.$showRemoveButton ? SPACING.spacing40 : SPACING.spacing8};
  background-color: rgba(22, 33, 45, 0.2);
  border-radius: ${BORDERS.borderRadius8};
  border: none;
  width: fit-content;
  min-width: 10rem;
  max-width: 100%;
`

const RemoveFileButton = styled.button`
  position: absolute;
  top: ${SPACING.spacing2};
  right: ${SPACING.spacing2};
  background: none;
  border: none;
  cursor: pointer;
  padding: ${SPACING.spacing2};
  border-radius: ${BORDERS.borderRadius4};
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${SPACING.spacing28};
  height: ${SPACING.spacing28};

  &:hover {
    background-color: ${COLORS.grey20};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${COLORS.blue50}40;
  }
`

const FileIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.borderRadius4};
  flex-shrink: 0;
`

const FileExtension = styled.div`
  font-size: ${TYPOGRAPHY.fontSizeP};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight20};
  color: #000;
  font-family: 'Reddit Mono';
  font-style: normal;
  text-align: center;
`

const FileDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.spacing4};
  min-width: 0;
  flex: 1;
  overflow: hidden;
`

const FileName = styled.div`
  font-size: ${TYPOGRAPHY.fontSizeP};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight16};
  color: ${COLORS.black90};
  font-family: 'Public Sans';
  font-style: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const FileDetails = styled.div`
  font-size: ${TYPOGRAPHY.fontSizeP};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight16};
  color: ${COLORS.black90};
  font-family: 'Public Sans';
  font-style: normal;
`
