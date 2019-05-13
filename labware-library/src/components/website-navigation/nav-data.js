// @flow
import type { Submenu, ProtocolLinks, SupportLinks, SalesLinks } from './types'

export const navLinkProps: Array<Submenu> = [
  {
    name: 'About',
    links: [
      {
        name: 'Mission',
        url: 'https://opentrons.com/about',
        gtm: { action: 'click', category: 'l-header', label: 'about' },
      },
      {
        name: 'Our Team',
        url: 'https://opentrons.com/team',
        gtm: { action: 'click', category: 'l-header', label: 'team' },
      },
      {
        name: 'Blog',
        url: 'https://blog.opentrons.com',
        gtm: { action: 'click', category: 'l-header', label: 'blog' },
      },
    ],
  },
  {
    name: 'Products',
    links: [
      {
        name: 'OT-2 Robot',
        url: 'https://opentrons.com/ot-2',
        gtm: { action: 'click', category: 'l-header', label: 'ot-2' },
      },
      {
        name: 'OT-2 Pipettes',
        url: 'https://opentrons.com/pipettes',
        gtm: { action: 'click', category: 'l-header', label: 'ot-2-pipettes' },
      },
      {
        name: 'OT-2 Add-ons',
        url: 'https://opentrons.com/modules',
        gtm: { action: 'click', category: 'l-header', label: 'modules' },
      },
      {
        name: 'Pipette Tips',
        url: 'https://shop.opentrons.com/collections/opentrons-tips',
        gtm: { action: 'click', category: 'l-header', label: 'tips' },
      },
      {
        name: 'Racks & Adapters',
        url: 'https://shop.opentrons.com/collections/racks-and-adapters',
        gtm: { action: 'click', category: 'l-header', label: 'tube-racks' },
      },
      {
        name: 'Reagents',
        url: 'https://shop.opentrons.com/collections/mag-bead-kits',
        gtm: { action: 'click', category: 'l-header', label: 'reagents' },
      },
    ],
    bottomLink: {
      name: 'Shop All Products',
      url: 'https://shop.opentrons.com',
      gtm: { action: 'click', category: 'l-header', label: 'all-products' },
    },
  },
  {
    name: 'Applications',
    links: [
      {
        name: 'PCR Sample Prep',
        url: 'https://opentrons.com/pcr-sample-prep',
        gtm: { action: 'click', category: 'l-header', label: 'prep' },
      },
      {
        name: 'Nucleic Acid Purification',
        url:
          'https://protocols.opentrons.com/categories/Molecular%20Biology/Nucleic%20Acid%20Purification',
        gtm: { action: 'click', category: 'l-header', label: 'nap' },
      },
      {
        name: 'qPCR/RT-PCR',
        url: 'https://protocols.opentrons.com/categories/Sample%20Prep/PCR',
        gtm: { action: 'click', category: 'l-header', label: 'qpcr' },
      },
      {
        name: 'ELISA',
        url: 'https://protocols.opentrons.com/protocol/TSH_ELISA_2018-1-25',
        gtm: { action: 'click', category: 'l-header', label: 'elisa' },
      },
      {
        name: 'NGS Library Prep',
        url: 'https://protocols.opentrons.com/categories/NGS%20Library%20Prep',
        gtm: { action: 'click', category: 'l-header', label: 'ngs-prep' },
      },
      {
        name: 'Basic Pipetting',
        url: 'https://protocols.opentrons.com/categories/Basic%20Pipetting',
        gtm: { action: 'click', category: 'l-header', label: 'basic' },
      },
    ],
  },
]

export const protocolLinkProps: ProtocolLinks = {
  options: {
    name: 'Protocol Options',
    url: 'https://opentrons.com/protocols',
    description: 'Gain an overview of our protocol creation options',
    gtm: { action: 'click', category: 'l-header', label: 'protocol-tools' },
  },
  designer: {
    name: 'Protocol Designer',
    url: 'https://opentrons.com/protocols/designer',
    description: 'Use our graphical user interface to design protocols',
    gtm: { action: 'click', category: 'l-header', label: 'protocol-designer' },
  },
  library: {
    name: 'Protocol Library',
    url: 'https://protocols.opentrons.com',
    description: 'Explore our open source database of protocols',
    gtm: { action: 'click', category: 'l-header', label: 'protocol-library' },
  },
  api: {
    name: 'Python API',
    url: 'https://docs.opentrons.com/',
    description:
      'Maximum customization for anyone with Python and basic wetlab skills',
    gtm: { action: 'click', category: 'l-header', label: 'opentrons-api' },
  },
  github: {
    name: 'GitHub',
    url: 'https://github.com/Opentrons',
    description: 'Contribute to our open source protocol repository',
    gtm: { action: 'click', category: 'l-header', label: 'github-protocols' },
  },
  bottomLink: {
    name: 'Request a free custom protocol',
    url: 'https://opentrons.com/request-protocol',
    cta: true,
    gtm: {
      action: 'click',
      category: 'l-header',
      label: 'request-protocol-protocols',
    },
  },
}

export const supportLinkProps: SupportLinks = {
  start: {
    name: 'OT-2 Start guide',
    url:
      'https://support.opentrons.com/guide-for-getting-started-with-the-ot-2',
    description: "You recieved your robot, here's what's next",
    gtm: { action: 'click', category: 'l-header', label: 'start-guide' },
  },
  help: {
    name: 'Product Help',
    url: 'https://support.opentrons.com/',
    description: 'Answer common technical questions',
    gtm: { action: 'click', category: 'l-header', label: 'product-help' },
  },
  github: {
    name: 'GitHub',
    url: 'https://github.com/Opentrons',
    description: 'Contribute to our open source protocol repository',
    gtm: { action: 'click', category: 'l-header', label: 'github-support' },
  },
  labware: {
    name: 'Labware Library',
    url:
      'https://intercom.help/opentrons-protocol-designer/intro/opentrons-standard-labware',
    description: 'Understand what labware is compatible with the OT-2',
    gtm: { action: 'click', category: 'l-header', label: 'labware-library' },
  },
  app: {
    name: 'Install the App',
    url: 'http://opentrons.com/ot-app',
    gtm: { action: 'click', category: 'l-header', label: 'ot-app' },
  },
  support: {
    name: 'Contact Support',
    url: 'https://opentrons.com/contact-support',
    cta: true,
    gtm: { action: 'click', category: 'l-header', label: 'contact-support' },
  },
}

export const salesLinkProps: SalesLinks = {
  order: {
    name: 'Order Online',
    url: 'https://shop.opentrons.com/',
    gtm: { action: 'click', category: 'l-header', label: 'shop' },
  },
  sales: {
    name: 'Contact Sales',
    url: 'http://opentrons.com/contact',
    cta: true,
    gtm: { action: 'click', category: 'l-header', label: 'contact-sales' },
  },
  demo: {
    name: 'Schedule Demo',
    url: 'http://opentrons.com/demo',
    cta: true,
    gtm: { action: 'click', category: 'l-header', label: 'schedule-demo' },
  },
}
