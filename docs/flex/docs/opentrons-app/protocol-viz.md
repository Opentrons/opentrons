---
title: "Opentrons Flex: Protocol Visualization"
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
- Scroll and click to choose a protocol step to view from the timeline on the left.

<figure markdown>
![Image showing the play bar at the top of the page.](../images/viz-play-bar.png)
</figure>

As you visualize each step of your protocol, the deck view changes to include liquid, labware, and pipette tip changes.

!!! note
    In the example protocol above, liquids are assigned a color in Protocol Designer, so wells containing liquids are colored and changes on the deck are more visible.

    You're not required to define or label liquids in protocols created using the Python Protocol API. In order to see liquid changes on the deck, we recommend using optional liquid labels and colors for the best protocol visualization.


## Labware and liquids

At any point in your protocol, hover over labware on the deck to see labware names. For a closer look, click any slot to open a slot spotlight. 

<figure markdown>
![Image showing slot spotlight view.](../images/slot-spotlight.png)
</figure>

Open slot spotlights for tip racks and labware on the deck or on a module to view tip, liquid, and module changes, like temperature, shake speed, or Thermocycler Module profiles.

For each step, additional protocol details appear on the right side of the screen: 

- **Pipettes**: attached pipettes and their mounts, including the active pipette performing liquid handling actions.
- **Tip pickup**: a closer look at where tips will be picked up for this step, including the number of tips remaining in the rack.
- **Well view**: well dimensions, the position of the pipette's attached tip, and a view of liquids in the well.
- **Labware**: liquid and well changes in labware like well plates and reservoirs.
- **Disposal**: where the pipette will dispose of attached tips and the number of tips currently in the default trash container.

<figure markdown>
![Image showing protocol visualization details for tips, labware, wells, and more.](../images/viz-details.png)
</figure>

## Editing errors

upload a protocol with an error and fill out this section + screenshot






