// @flow
import * as React from 'react'
import ClickableText from './ClickableText'
import styles from './labware.css'
import ForeignDiv from '../../components/ForeignDiv'
import i18n from '../../localization'
import {ClickOutside} from '@opentrons/components'

type Props = {
  setLabwareName: (name: ?string) => mixed,
  // TODO Ian 2018-02-16 type these fns elsewhere and import the type
  editLiquids: () => mixed,
}

type State = {
  pristine: boolean,
  inputValue: string,
}

export default class NameThisLabwareOverlay extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      pristine: true,
      inputValue: '',
    }
  }

  handleChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      pristine: false,
      inputValue: e.target.value,
    })
  }

  handleKeyUp = (e: SyntheticKeyboardEvent<*>) => {
    if (e.key === 'Enter') {
      this.onSubmit()
    }
  }

  onSubmit = () => {
    const containerName = this.state.inputValue || null
    this.props.setLabwareName(containerName)
  }

  onAddLiquids = () => {
    this.onSubmit()
    this.props.editLiquids()
  }

  render () {
    return (
      <ClickOutside onClickOutside={this.onSubmit}>
        {({ref}) => (
          <g className={styles.slot_overlay} ref={ref}>
            <rect className={styles.overlay_panel} />
            <g transform='translate(5, 0)'>
              <ForeignDiv x='0' y='15%' width='92%'>
                <input
                  className={styles.name_input}
                  onChange={this.handleChange}
                  onKeyUp={this.handleKeyUp}
                  placeholder={i18n.t('labware_overlays.name_labware.nickname_placeholder')}
                  value={this.state.inputValue}
                />
              </ForeignDiv>

              <ClickableText onClick={this.onAddLiquids}
                iconName='water' y='50%' text={i18n.t('labware_overlays.name_labware.add_liquids')} />

              <ClickableText onClick={this.onSubmit}
                iconName='ot-water-outline' y='75%' text={i18n.t('labware_overlays.name_labware.leave_empty')} />
            </g>
          </g>
        )}
      </ClickOutside>
    )
  }
}
