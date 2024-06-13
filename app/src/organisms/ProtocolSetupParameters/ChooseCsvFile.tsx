import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
// import { useDispatch } from 'react-redux'
import { css } from 'styled-components'
import { last } from 'lodash'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

// import { RadioButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { EmptyFile } from './EmptyFile'
import { RadioButton } from '../../atoms/buttons'
import { getFilePaths } from '../../redux/shell'

// import { Dispatch } from '../../redux/types'

import type { RunTimeParameter } from '@opentrons/shared-data'

interface ChooseCsvFileProps {
  handleGoBack: () => void
  parameter: RunTimeParameter | null
  setParameter: (value: boolean | string | number, variableName: string) => void
  /** if files on robot has the same id, the file name is highlighted */
  fileInfo: string
  /** If a user chooses a file on robot, store fileId. If a user chooses a file on usb, store full file path.  */
  setFileInfo: (fileInfo: string) => void
  // rawValue: number | string | boolean
}

export function ChooseCsvFile({
  handleGoBack,
  parameter,
  setParameter,
  fileInfo,
  setFileInfo,
}: // rawValue,
ChooseCsvFileProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const csvFilesOnUSB = useSelector(getFilePaths).payload.filePaths ?? []

  // console.log('csv files', csvFilesOnUSB)
  // ToDo (kk:06/12/2024) get files from the endpoint: GET /protocols/{protocolId}/dataFiles/
  // return format: https://opentrons.atlassian.net/browse/AUTH-428
  const csvFilesOnRobot: any[] = []

  const handleConfirmSelection = (): void => {
    // set selected file's fileId or file full path
    // setFileInfo('')
  }

  return (
    <>
      <ChildNavigation
        header={t('choose_csv_file')}
        onClickBack={handleGoBack}
        buttonType="tertiaryLowLight"
        buttonText={t('confirm_selection')}
        onClickButton={handleConfirmSelection}
      />
      <Flex
        marginTop="7.75rem"
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        paddingBottom={SPACING.spacing40}
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing48}>
          <Flex css={CONTAINER_STYLE}>
            <StyledText css={HEADER_TEXT_STYLE}>
              {t('csv_files_on_robot')}
            </StyledText>
            <Flex css={LIST_CONTAINER_STYLE}>
              {csvFilesOnRobot.length !== 0 ? (
                csvFilesOnRobot.map(csv => (
                  <RadioButton
                    key={csv.fileId}
                    data-testid={`${csv.fileId}`}
                    buttonLabel={csv.displayName}
                    buttonValue={`${csv.fileId}`}
                    onChange={() => {}}
                  />
                ))
              ) : (
                <EmptyFile />
              )}
            </Flex>
          </Flex>
          <Flex css={CONTAINER_STYLE}>
            <StyledText css={HEADER_TEXT_STYLE}>
              {t('csv_files_on_usb')}
            </StyledText>
            <Flex css={LIST_CONTAINER_STYLE}>
              {csvFilesOnUSB.length !== 0 ? (
                csvFilesOnUSB.map(csv => (
                  <>
                    {csv.length !== 0 && last(csv.split('/')) !== undefined ? (
                      <RadioButton
                        key={last(csv.split('/'))}
                        data-testid={`${last(csv.split('/'))}`}
                        buttonLabel={last(csv.split('/')) ?? 'default'}
                        buttonValue={csv}
                        onChange={() => {
                          // set the file full path
                          // unselect radio button in robot
                          setFileInfo(csv)
                        }}
                      />
                    ) : null}
                  </>
                ))
              ) : (
                <EmptyFile />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

const HEADER_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
`

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
  flex: 1;
`

const LIST_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  width: 100%;
`
