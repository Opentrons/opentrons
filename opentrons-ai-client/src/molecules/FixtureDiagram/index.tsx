import { css } from 'styled-components'

import type { FixtureType } from '../../organisms/ModulesAndFixturesSection'

import trash_bin_img from '../../assets/images/fixtures/flex_trash_bin.png'
import staging_area_img from '../../assets/images/fixtures/staging_area.png'
import waste_chute_img from '../../assets/images/fixtures/waste_chute.png'

interface Props {
  type: FixtureType
}

type FixtureImg = {
  [type in FixtureType]: string
}

const FIXTURE_IMG_BY_TYPE: FixtureImg = {
  stagingArea: staging_area_img,
  wasteChute: waste_chute_img,
  trashBin: trash_bin_img,
}

const IMAGE_MAX_WIDTH = '96px'
export function FixtureDiagram(props: Props): JSX.Element {
  const model = FIXTURE_IMG_BY_TYPE[props.type]
  return (
    <img
      css={css`
        max-width: ${IMAGE_MAX_WIDTH};
        width: 100%;
        height: auto;
      `}
      src={model}
      alt={props.type}
    />
  )
}
