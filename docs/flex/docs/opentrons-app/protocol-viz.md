---
title: "Opentrons Flex: Protocol visualization"
---

It's important to test a new protocol before running it on your Flex. In the Opentrons App, you can use protocol visualization to: 

- See protocol steps, including labware and liquid changes, while offline and disconnected from your Flex.
- Detect and fix protocol errors before the first run.
- Assess new protocols created with Protocol Designer, OpentronsAI, or the Python Protocol API.

Click **Visualize** on any Flex protocol's [details page](../touchscreen/protocol-details.md) to get started.

<figure markdown>
![Image showing protocol visualization in the Opentrons App](../images/protocol-viz.png)
</figure>

The visualization screen shown above includes protocol steps on the left, a view of the Flex deck in the middle, and hardware and labware details on the right. The following sections take a closer look at using protocol visualization to preview, troubleshoot, and edit your Flex protocols. 

## Protocol steps

Choose how to visualize your Flex protocol's steps: 

- Click [blue play button] at the top of the page to play your protocol, and choose a playback speed (seconds per step).
- Click and drag the blue bar to move through the protocol steps. 
- Scroll through the protocol steps in the timeline on the left.

As you visualize each step of your protocol, the deck view changes to include liquid, labware, and pipette tip changes.

!!! note
    In the example protocol above, liquids were assigned a color in Protocol Designer. However, it's not required to define or label liquids in protocols created using the Python Protocol API. In order to see liquid changes on the deck, we recommend using optional liquid labels and colors for the best protocol visualization. 


## Liquid handling behavior

## Labware

## Editing errors






