import * as React from 'react'
<<<<<<< HEAD
import { PrimaryButton } from '@opentrons/components'
import styles from '../../styles.module.css'
=======
import { useFormikContext } from 'formik'
import { PrimaryBtn } from '@opentrons/components'
import { reportEvent } from '../../../analytics'
import { FormStatus, LabwareFields } from '../../fields'
import { isEveryFieldHidden } from '../../utils'
import { getPipetteNameOptions } from '../getPipetteOptions'
import { FormAlerts } from '../alerts/FormAlerts'
import { Dropdown } from '../Dropdown'
import { LinkOut } from '../LinkOut'
import { SectionBody } from './SectionBody'
import styles from '../../styles.module.css'
import { determineMultiChannelSupport } from '../../utils/determineMultiChannelSupport'

const LABWARE_PDF_URL =
  'https://insights.opentrons.com/hubfs/Products/Consumables%20and%20Reagents/labwareDefinition_testGuide.pdf'
const TIPRACK_PDF_URL =
  'https://insights.opentrons.com/hubfs/Products/Consumables%20and%20Reagents/labwareDefinition_tipRack_testGuide.pdf'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

interface ExportProps {
  onExportClick: (e: React.MouseEvent) => unknown
}

export const Export = (props: ExportProps): JSX.Element | null => {
  return (
    <div>
      <div className={styles.export_section} id="DefinitionTest">
        <PrimaryButton
          className={styles.export_button}
          onClick={props.onExportClick}
        >
          EXPORT FILE
        </PrimaryButton>
      </div>
    </div>
  )
}
