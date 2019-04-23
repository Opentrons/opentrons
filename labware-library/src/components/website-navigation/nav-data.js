// @flow
import type { Submenu, ProtocolLinks, SupportLinks, SalesLinks } from './types'

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

export const protocolLinkProps: ProtocolLinks = {
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
  bottomLink: {
    name: 'Request a free custom protocol',
    url: 'https://opentrons.com/request-protocol',
  },
}

export const supportLinkProps: SupportLinks = {
  start: {
    name: 'OT-2 Start guide',
    url:
      'https://support.opentrons.com/guide-for-getting-started-with-the-ot-2',
    description: "You recieved your robot, here's what's next",
  },
  help: {
    name: 'Product Help',
    url: 'https://support.opentrons.com/',
    description: 'Answer common technical questions',
  },
  github: {
    name: 'Github',
    url: 'https://github.com/Opentrons',
    description: 'Contribute to open source protocol repository',
  },
  labware: {
    name: 'Labware Library',
    url:
      'https://intercom.help/opentrons-protocol-designer/intro/opentrons-standard-labware',
    description: 'Understand what labware is compatible with the OT-2',
  },
  app: {
    name: 'Install the app',
    url: 'http://opentrons.com/ot-app',
  },
  support: {
    name: 'Contact support',
    url: 'http://opentrons.com/contact',
  },
}

export const salesLinkProps: SalesLinks = {
  order: {
    name: 'Order online',
    url: 'https://shop.opentrons.com/',
  },
  sales: {
    name: 'Contact sales',
    url: 'http://opentrons.com/contact',
  },
  demo: {
    name: 'Schedule Demo',
    url: 'http://opentrons.com/demo',
  },
}
