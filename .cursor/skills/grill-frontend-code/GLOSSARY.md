# Glossary for Frontend Review

This glossary defines both Opentrons hardware/software domain concepts and specific code-quality anchors used during reviews.

## Review Mechanics (Leading Words)
* **Prop Shadowing** — The anti-pattern of manually typing standard HTML attributes (e.g., `onClick`, `className`) into a custom component's props interface instead of extending native element types.

## Opentrons Domain Concepts
* **UI Components** — The official `@opentrons/components` component library.
* **ODD** — On-Device Display; the touch-screen application running directly on the robot.
* **Flex** — Opentrons' third-generation liquid-handling robot.
* **OT-2** — Opentrons' second-generation liquid-handling robot.
* **Pipette** — A hardware device for transporting precise, small amounts of liquid.
* **Deck** — The machined aluminum surface where automated science protocols are physically executed.
* **Modules** — Peripheral hardware devices occupying deck slots, typically controlled by the Flex via USB.
* **Staging Area** — The physical expansion area on the right-hand side of the deck (column 4) reserved exclusively for gripping and staging labware.
* **Fixtures** — Custom structural deck hardware positioned between modules and labware slots.
* **Camera** — The onboard hardware camera providing a visual view of the above-deck area.
* **LPC** — Labware Position Check; the calibration process to verify exact labware coordinates.
* **PD** — Protocol Designer; the graphical user interface tool used by scientists to design JSON-based protocols without writing code.
* **PL** — Protocol Library; the public and private repository used for distributing Python-based automation protocols.
* **PE** — Protocol Engine; the core software execution environment that runs the protocol steps.
* **RTP** — Runtime Parameters; dynamic variables configured at the start of a protocol run.
* **LL** — Labware Library; the definition repository for all supported labware dimensions and behaviors.
* **Aspirate** — The physical action of drawing liquid up into a pipette tip.
* **Dispense** — The physical action of expelling liquid out of a pipette tip.
* **Push Out** — A minor, supplementary volumetric fluid displacement executed between the dispense and blowout stages.
* **Blowout** — The action of expelling all remaining liquid and a small cushion of air completely out of the pipette tip.
