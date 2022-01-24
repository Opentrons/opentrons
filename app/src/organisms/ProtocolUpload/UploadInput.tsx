import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import {
  Icon,
  Text,
  Flex,
  NewPrimaryBtn,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_REGULAR,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  C_MED_LIGHT_GRAY,
  C_MED_GRAY,
  SIZE_3,
  Link,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  C_WHITE,
  JUSTIFY_CENTER,
  C_BLUE,
  SPACING_1,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  FONT_SIZE_CAPTION,
  FONT_BODY_1_DARK,
  NewSecondaryBtn,
  FONT_SIZE_BODY_1,
  SPACING_2,
  JUSTIFY_START,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'
import { getLatestLabwareOffsetCount } from '../ProtocolSetup/LabwarePositionCheck/utils/getLatestLabwareOffsetCount'
import { useProtocolDetails } from '../RunDetails/hooks'
import { getConnectedRobotName } from '../../redux/robot/selectors'
import { Divider } from '../../atoms/structure'
import { useMostRecentRunId } from './hooks/useMostRecentRunId'
import { RerunningProtocolModal } from './RerunningProtocolModal'
import { useCloneRun } from './hooks'
import { getRunDisplayStatus } from './getRunDisplayStatus'
import type { State } from '../../redux/types'

const PROTOCOL_LIBRARY_URL = 'https://protocols.opentrons.com'
const PROTOCOL_DESIGNER_URL = 'https://designer.opentrons.com'

const DROP_ZONE_STYLES = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  width: 50%;
  font-size: ${FONT_SIZE_BODY_2};
  font-weight: ${FONT_WEIGHT_REGULAR};
  padding: ${SPACING_5};
  border: 2px dashed ${C_MED_LIGHT_GRAY};
  border-radius: 6px;
  color: ${C_MED_GRAY};
  text-align: center;
  margin-bottom: ${SPACING_4};
  background-color: ${C_WHITE};
`
const DRAG_OVER_STYLES = css`
  background-color: ${C_BLUE};
  color: ${C_WHITE};
`

const INPUT_STYLES = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

export interface UploadInputProps {
  onUpload: (file: File) => unknown
}

export function UploadInput(props: UploadInputProps): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  const history = useHistory()
  const mostRecentRunId = useMostRecentRunId()
  const runQuery = useRunQuery(mostRecentRunId)
  const mostRecentRun = runQuery.data?.data
  const mostRecentProtocolInfo = useProtocolQuery(
    (mostRecentRun?.protocolId as string) ?? null
  )
  const mostRecentProtocol = mostRecentProtocolInfo?.data?.data
  const protocolData = useProtocolDetails()
  //  If mostRecentRun is null, the CTA that uses cloneRun won't appear so this will never be reached
  const { cloneRun } = useCloneRun(
    mostRecentRunId != null ? mostRecentRunId : null
  )
  const robotName = useSelector((state: State) => getConnectedRobotName(state))
  const fileInput = React.useRef<HTMLInputElement>(null)
  const [isFileOverDropZone, setIsFileOverDropZone] = React.useState<boolean>(
    false
  )
  const [rerunningProtocolModal, showRerunningProtocolModal] = React.useState(
    false
  )
  const labwareOffsets = mostRecentRun?.labwareOffsets
  const protocolName = protocolData.displayName
  const mostRecentRunFileName =
    mostRecentProtocol != null && mostRecentProtocol.files != null
      ? mostRecentProtocol.files.find(file => file.role === 'main')?.name
      : null
  const mostRecentRunStatus =
    mostRecentProtocol != null && mostRecentRun?.status != null
      ? getRunDisplayStatus(mostRecentRun)
      : null

  const handleDrop: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    const { files = [] } = 'dataTransfer' in e ? e.dataTransfer : {}
    props.onUpload(files[0])
    setIsFileOverDropZone(false)
  }
  const handleDragEnter: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDragLeave: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsFileOverDropZone(false)
  }
  const handleDragOver: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsFileOverDropZone(true)
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = _event => {
    fileInput.current?.click()
  }

  const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { files = [] } = event.target ?? {}
    files?.[0] && props.onUpload(files?.[0])
    if ('value' in event.currentTarget) event.currentTarget.value = ''
  }

  const dropZoneStyles = isFileOverDropZone
    ? css`
        ${DROP_ZONE_STYLES} ${DRAG_OVER_STYLES}
      `
    : DROP_ZONE_STYLES

  const labwareOffsetCount = getLatestLabwareOffsetCount(labwareOffsets ?? [])

  const handleCloneRun = (): void => {
    cloneRun()
    history.push('/run')
  }

  return (
    <Flex
      height="100%"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
    >
      {rerunningProtocolModal && (
        <RerunningProtocolModal
          onCloseClick={() => showRerunningProtocolModal(false)}
        />
      )}
      <NewPrimaryBtn
        onClick={handleClick}
        marginBottom={SPACING_4}
        id={'UploadInput_protocolUploadButton'}
      >
        {t('choose_file')}
      </NewPrimaryBtn>

      <label
        data-testid="file_drop_zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        css={dropZoneStyles}
      >
        <Icon width={SIZE_3} name="upload" marginBottom={SPACING_4} />

        <span
          aria-controls="file_input"
          role="button"
          id={'UploadInput_fileUploadLabel'}
        >
          {t('drag_file_here')}
        </span>

        <input
          id="file_input"
          data-testid="file_input"
          ref={fileInput}
          css={INPUT_STYLES}
          type="file"
          onChange={onChange}
        />
      </label>
      {mostRecentRun == null ? null : (
        <Flex flexDirection={DIRECTION_COLUMN} width={'80%'}>
          <Divider marginY={SPACING_3} />
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            flex={'auto'}
            marginBottom={SPACING_2}
          >
            <Trans
              t={t}
              i18nKey="robot_name_last_run"
              values={{ robot_name: robotName }}
            />
            <Link
              role={'link'}
              fontSize={FONT_SIZE_BODY_1}
              color={C_BLUE}
              onClick={() => showRerunningProtocolModal(true)}
              id={'RerunningProtocol_Modal'}
              data-testid={'RerunningProtocol_ModalLink'}
            >
              {t('rerunning_protocol_modal_title')}
            </Link>
          </Flex>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            marginBottom={SPACING_4}
          >
            <Flex
              flex={'auto'}
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_CENTER}
            >
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {t('protocol_name_title')}
              </Text>
              <Flex css={FONT_BODY_1_DARK}>
                {protocolName != null ? protocolName : mostRecentRunFileName}
              </Flex>
            </Flex>
            <Flex
              flex={'auto'}
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_CENTER}
            >
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {'Run status'}
              </Text>
              <Flex css={FONT_BODY_1_DARK}>
                <Text textTransform={TEXT_TRANSFORM_CAPITALIZE}>
                  {mostRecentRunStatus}
                </Text>
              </Flex>
            </Flex>
            <Flex
              flex={'auto'}
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_CENTER}
            >
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {t('run_timestamp_title')}
              </Text>
              <Flex css={FONT_BODY_1_DARK} flexDirection={DIRECTION_ROW}>
                {format(
                  parseISO(mostRecentRun.createdAt),
                  'yyyy-MM-dd pp xxxxx'
                )}
              </Flex>
            </Flex>
            <Flex
              flex={'auto'}
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_CENTER}
            >
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {t('labware_offset_data_title')}
              </Text>
              <Flex css={FONT_BODY_1_DARK}>
                {labwareOffsetCount === 0 ? (
                  <Text>{t('no_labware_offset_data')}</Text>
                ) : (
                  <Trans
                    t={t}
                    i18nKey="labware_offsets_info"
                    values={{ number: labwareOffsetCount }}
                  />
                )}
              </Flex>
            </Flex>
            <Flex>
              <NewSecondaryBtn
                onClick={handleCloneRun}
                id={'UploadInput_runAgainButton'}
              >
                {t('run_again')}
              </NewSecondaryBtn>
            </Flex>
          </Flex>
          <Divider />
        </Flex>
      )}
      <Text
        role="complementary"
        as="h4"
        marginBottom={SPACING_3}
        marginTop={SPACING_3}
      >
        {t('no_protocol_yet')}
      </Text>
      <Flex justifyContent={JUSTIFY_START} flexDirection={DIRECTION_COLUMN}>
        <Link
          fontSize={FONT_SIZE_BODY_2}
          color={C_BLUE}
          href={PROTOCOL_LIBRARY_URL}
          id={'UploadInput_protocolLibraryButton'}
          marginBottom={SPACING_1}
          external
        >
          {t('browse_protocol_library')}
          <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
        </Link>
        <Link
          fontSize={FONT_SIZE_BODY_2}
          color={C_BLUE}
          href={PROTOCOL_DESIGNER_URL}
          id={'UploadInput_protocolDesignerButton'}
          external
        >
          {t('launch_protocol_designer')}
          <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
        </Link>
      </Flex>
    </Flex>
  )
}
