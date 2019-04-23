// @flow
import type { Submenu, LinksByName } from './types'

export const navLinkProps: Array<Submenu> = [
  {
    name: 'about',
    links: [
      { name: 'mission', url: 'https://opentrons.com/about' },
      { name: 'our team', url: 'https://opentrons.com/team' },
      { name: 'blog', url: 'https://blog.opentrons.com' },
    ],
  },
  {
    name: 'products',
    links: [
      { name: 'OT-2 Robot', url: 'https://opentrons.com/ot-2' },
      { name: 'OT-2 Pipettes', url: 'https://opentrons.com/pipettes' },
      { name: 'OT-2 Add-ons', url: 'https://opentrons.com/modules' },
      {
        name: 'Pipette Tips',
        url: 'https://shop.opentrons.com/collections/opentrons-tips',
      },
      {
        name: 'Racks & Adapters',
        url: 'https://shop.opentrons.com/collections/racks-and-adapters',
      },
      {
        name: 'Reagents',
        url: 'https://shop.opentrons.com/collections/mag-bead-kits',
      },
    ],
    bottomLink: {
      name: 'shop all products',
      url: 'https://shop.opentrons.com',
    },
  },
  {
    name: 'applications',
    links: [
      { name: 'PCR Sample Prep', url: 'https://opentrons.com/pcr-sample-prep' },
      {
        name: 'Nucleic Acid Purification',
        url:
          'https://protocols.opentrons.com/categories/Molecular%20Biology/Nucleic%20Acid%20Purification',
      },
      {
        name: 'qPCR/RT-PCR',
        url: 'https://protocols.opentrons.com/categories/Sample%20Prep/PCR',
      },
      {
        name: 'ELISA',
        url: 'https://protocols.opentrons.com/protocol/TSH_ELISA_2018-1-25',
      },
      {
        name: 'NGS Library Prep',
        url: 'https://protocols.opentrons.com/categories/NGS%20Library%20Prep',
      },
      {
        name: 'Basic Pipetting',
        url: 'https://protocols.opentrons.com/categories/Basic%20Pipetting',
      },
    ],
  },
]

export const protocolLinkProps: LinksByName = {
  options: {
    name: 'Protocol Options',
    url: 'https://opentrons.com/protocols',
    description: 'Gain an overview of our protocol creation options',
  },
  designer: {
    name: 'Protocol Designer',
    url: 'https://opentrons.com/protocols/designer',
    description: 'Use our graphical user interface to design protocols',
  },
  library: {
    name: 'Protocol Library',
    url: 'https://protocols.opentrons.com',
    description: 'Explore our open source database of protocols',
  },
  api: {
    name: 'Python API',
    url: 'https://docs.opentrons.com/',
    description:
      'Maximum customization for anyone with python and basic wetlab skills',
  },
  github: {
    name: 'Github',
    url: 'https://github.com/Opentrons',
    description: 'Contribute to open source protocol repository',
  },
}
