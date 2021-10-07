import * as React from 'react'
import { Fragment, useRef, useEffect, useState, useCallback } from 'react'
import { UploadInput } from './UploadInput'
import { ConfirmUploadModal } from './ConfirmUploadModal'
import { UploadMenu } from './UploadMenu'
import { getConnectedRobot } from '../../../redux/discovery'
import { connect, useSelector } from 'react-redux'
import { PrimaryButton, Icon } from '@opentrons/components'
import useWebSocket, { ReadyState } from 'react-use-websocket'

export interface UploadProps {
  filename: string | null | undefined
  sessionLoaded: boolean | null | undefined
  createSession: (file: File) => unknown
}

interface UploadState {
  uploadedFile: File | null | undefined
}

function VolumeForm() {
  const didUnmount = useRef(false)
  const connectedRobot = useSelector(getConnectedRobot)
  console.log('test', connectedRobot)
  const [volumes, setVolumes] = useState(null)
  const { lastJsonMessage, readyState, sendJsonMessage } = useWebSocket(
    // `ws://${connectedRobot.ip}:13555/`,
    `ws://192.168.1.181:13555/`,
    {
      shouldReconnect: () => didUnmount.current === false,
      reconnectInterval: 3000,
    }
  )

  useEffect(() => () => (didUnmount.current = true), [])
  useEffect(() => {
    if (volumes === null && lastJsonMessage) {
      setVolumes(
        Object.fromEntries(
          Object.entries(lastJsonMessage).map(([k, v]) => [k, v.toFixed(2)])
        )
      )
    }
  }, [lastJsonMessage, volumes])

  const handleChange = useCallback(event => {
    const { name, value } = event.target
    setVolumes(volumes => ({ ...volumes, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      sendJsonMessage(
        Object.fromEntries(
          Object.entries(volumes).map(([k, v]) => [k, parseFloat(v)])
        )
      )
    },
    [sendJsonMessage, volumes]
  )

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState]
  if (!volumes) return connectionStatus

  return (
    <form action="#" style={{ padding: 16 }} onSubmit={handleSubmit}>
      <strong>Volumes:</strong>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, auto)',
          margin: '10px 0',
        }}
      >
        {Object.keys(volumes)
          .sort()
          .map(key => (
            <Fragment key={key}>
              <span>{key}</span>
              <input name={key} value={volumes[key]} onChange={handleChange} />
              <span>μL</span>
            </Fragment>
          ))}
      </div>
      <PrimaryButton type="submit">Save</PrimaryButton>
    </form>
  )
}

export class Upload extends React.Component<UploadProps, UploadState> {
  constructor(props: UploadProps) {
    super(props)
    this.state = { uploadedFile: null }
  }

  onUpload:
    | React.ChangeEventHandler<HTMLInputElement>
    | React.DragEventHandler = (
    event: React.ChangeEvent<HTMLInputElement> | React.DragEvent
  ) => {
    let files: File[] = []

    // @ts-expect-error TODO: use commented code below
    if (event.dataTransfer && event.dataTransfer.files) {
      // @ts-expect-error TODO: use commented code below
      files = event.dataTransfer.files as any
      // @ts-expect-error TODO: use commented code below
    } else if (event.target.files) {
      // @ts-expect-error TODO: use commented code below
      files = event.target.files as any
    }

    //   if ('dataTransfer' in event && event.dataTransfer.files) {
    //     files = event.dataTransfer.files as any
    //   } else if ('files' in event.target && event.target?.files) {
    //     files = event.target.files as any
    //   }

    if (this.props.sessionLoaded) {
      this.setState({ uploadedFile: files[0] })
    } else {
      this.props.createSession(files[0])
    }

    // @ts-expect-error TODO: use commented code below
    event.currentTarget.value = ''
    // if ('value' in event.currentTarget) event.currentTarget.value = ''
  }

  confirmUpload: () => void = () => {
    const { uploadedFile } = this.state

    if (uploadedFile) {
      this.props.createSession(uploadedFile)
      this.forgetUpload()
    }
  }

  forgetUpload: () => void = () => {
    this.setState({ uploadedFile: null })
  }

  render(): JSX.Element {
    const { uploadedFile } = this.state
    const { filename } = this.props

    return (
      <>
        {filename && <UploadMenu />}
        <UploadInput onUpload={this.onUpload} isButton />
        <UploadInput onUpload={this.onUpload} />
        {uploadedFile && (
          <ConfirmUploadModal
            confirm={this.confirmUpload}
            cancel={this.forgetUpload}
          />
        )}
        <VolumeForm />
      </>
    )
  }
}
