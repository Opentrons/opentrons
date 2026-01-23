---
title: "Protocol Designer: Module steps"
---

When you add modules to the robot deck, available module steps appear in the "Add step" menu. Protocol Designer supports the use of the following modules:

| Module and generation | Opentrons Flex | Opentrons OT-2 |
| --------------------- | :--------------: | :--------: |
| Absorbance Plate Reader Module GEN1 | :octicons-check-16: | :octicons-x-16: |
| Flex Stacker Module GEN1 | :octicons-check-16: | :octicons-x-16: |
| Heater-Shaker Module GEN1 | :octicons-check-16: | :octicons-x-16: |
| Magnetic Module GEN1 | :octicons-x-16: | :octicons-check-16: |
| Magnetic Module GEN2 | :octicons-x-16: | :octicons-check-16: |
| Magnetic Block GEN1 | :octicons-x-16: | :octicons-check-16: |
| Temperature Module GEN1 | :octicons-x-16: | :octicons-check-16: |
| Temperature Module GEN2 | :octicons-check-16: | :octicons-check-16: |
| Thermocycler Module GEN1 | :octicons-x-16:| :octicons-check-16: |
| Thermocycler Module GEN2 | :octicons-check-16: | :octicons-check-16: |


You can add multiple modules of the same type only on the Flex. However, both robots are limited to a single Thermocycler. 


## Absorbance Plate Reader Module steps

You'll need a Flex Gripper to add an Absorbance Plate Reader Module to your protocol starting deck. To prevent damage, only the gripper can move the lid on and off the Absorbance Plate Reader. The gripper automatically places the lid to the right of the plate reader, in deck column 4. 

To use an Absorbance Plate Reader Module in a Protocol Designer protocol, you'll need to initialize the Plate Reader, move a plate to the module, and read the plate using your chosen wavelength settings. 

Follow the instructions to add a total of six Absorbance Plate Reader steps to your protocol. 

<div class="instruction-list" markdown>

1. Add an Absorbance Plate Reader step to close the lid. In the step form, click to **Change lid position**. Click **Continue** and use the toggle switch to change the lid position from open to closed. The gripper will close the lid with no labware inside.

2. Use a second Absorbance Plate Reader step to initialize the module. Click **Define initialization settings** and choose a single or multiple initialization wavelengths from the dropdown menu. 
    Custom wavelengths between 350–1000 nanometers are supported. When using a single wavelength, you can add a reference wavelength for normalization or to correct for background interference. Your chosen settings appear as the current initialization settings when you add another Absorbance Plate Reader step.
    
    !!! Note
        To initialize the Absorbance Plate Reader, the module must be empty with the lid closed. Remove any labware and use a Plate Reader step to close the lid. 
    

    <figure class="screenshot" markdown>
    ![Plate Reader step](../images/plate_reader.png)
   <figcaption>Add a single initialization and a reference wavelength in a Plate Reader step.</figcaption>
2. Use a second Absorbance Plate Reader step to initialize the module. Click **Define initialization settings** and choose a single or multiple initialization wavelengths from the dropdown menu.

    !!! tip "Reminder"
        To initialize the Absorbance Plate Reader, the module must be empty with the lid closed. Remove any labware and use a Plate Reader step to close the lid.

    <figure class="screenshot" markdown>
    ![Plate Reader step](../images/plate_reader.png)
    <figcaption>Add a single initialization and a reference wavelength in a Plate Reader step.</figcaption>
    </figure>

    !!! note
        Custom wavelengths between 350–1000 nanometers are supported. When using a single wavelength, you can add a reference wavelength for normalization or to correct for background interference. Your chosen settings appear as the current initialization settings when you add another Absorbance Plate Reader step.

3. Add an Absorbance Plate Reader step to open the lid using the gripper. The Plate Reader lid must be open to add labware to the module. 

4. Use a move step to move your plate to the Absorbance Plate Reader. You can add labware to the module manually or using the gripper. 

    Most 96-well plates from the Opentrons [Labware Library](https://labware.opentrons.com "Labware Library") are supported. 

5. Add an Absorbance Plate Reader step to read the plate in the module. Click **Read labware** to collect absorbance data for the samples in your plate. 

    **Read labware** is only available if the Plate Reader is initialized, with a plate inside and the lid closed. 

6. Enter a name for your CSV file. You can find this file and any previous Absorbance Plate Reader data in your robot's recent protocol runs in the Opentrons App. 

    Data from this CSV file can be used in your Python protocols created outside of Protocol Designer.

    After reading your plate, follow the same steps to open the lid, remove the plate, and close the Absorbance Plate Reader lid with the gripper. 

</div>

Protocol Designer includes Absorbance Plate Reader step details to help you keep track of all six steps. Hover over each step in the timeline to view details below the deck map.

## Flex Stacker Module steps

Click **Add Step** in the bottom left to add a Stacker step to your Protocol Designer protocol. The step menu on the right shows the labware currently in the Flex Stacker and any labware on the attached shuttle. 

<figure class="screenshot" markdown>
  ![Add a Stacker step](../images/stacker_steps.png)
  <figcaption>Add a Stacker step to store or retrieve labware, or refill or empty your Flex Stacker.</figcaption>
</figure>

In the image above, labware on the shuttle and the top piece of labware in the Stacker are visible. Labware at the bottom of the stack can be moved to the shuttle, but you won't be able to see this labware on the Flex deck. Click the Stacker on the right side of the deck to view the labware stack. 

In the step menu, choose from the available module controls to: 

- **Retrieve** a single piece of labware loaded in the Stacker. The labware at the bottom of the stack will be moved onto the shuttle. Add a move step to transfer the labware elsewhere on the Flex deck, either manually or with the Flex Gripper. The shuttle must be empty to retrieve labware.
- **Store** a single piece of labware on the shuttle in the Stacker. The labware will be stored at the bottom of the stack.
- **Refill** the Stacker with the same type of labware originally loaded in the protocol starting deck. Select the labware type and quantity, and add an optional message to display on the Flex touchscreen.
- **Empty** all labware from the Stacker. Add an optional message to display on the Flex touchscreen.

Any labware filled into or emptied from the Stacker comes from the Flex's off-deck location, but you don't need to add it there yourself! When you add a refill or empty Stacker step, Protocol Designer creates the off-deck labware for you. Click the toggle switch at the top right of the deck view to see the off-deck labware at any point. 

## Heater-Shaker Module steps

Adding a Heater-Shaker Module step to your protocol displays any labware and adapters currently on the module. 

<figure class="screenshot" markdown>
  ![Heater-Shaker step](../images/heater_shaker.png)
  <figcaption>Add a temperature, shake speed, and timer for a Heater-Shaker step.</figcaption>
</figure>

In this example, a Corning 96-well flat plate is placed on top of an Opentrons Universal Flat Heater-Shaker adapter. Both are on the Heater-Shaker in deck slot D1. 

Before moving labware to or from the Heater-Shaker, make sure that the labware latch is open. Add a Heater-Shaker step that opens the labware latch before any step that moves labware to the Heater-Shaker. Without this step, a [timeline error](../warnings-errors.md#errors) could occur. 

In the Heater-Shaker step form, set the heater or shaker functions to **On** and enter a custom value for temperature or shake speed. The Heater-Shaker module can heat samples between 20 °C,and 95 °C, and shake samples between 200 and 3000 rpm. 

Set a custom time for your Heater-Shaker step by enabling the timer. The timer will begin after the Heater-Shaker reaches the target temperature or shaking speed. 

If your Heater-Shaker step doesn't include a set time, Protocol Designer will ask if you'd like to pause your protocol. Because reaching a target temperature takes more time than changing the shaking speed, you can set the Heater-Shaker to reach a target temperature while your protocol proceeds to the next step. 

<figure class="screenshot" markdown>
  ![Heater-Shaker pause](../images/heater-shaker-pause.png)
  <figcaption>Build a pause step now or later in your protocol.</figcaption>
</figure>

Click **Skip pause step** to resume your protocol while the Heater-Shaker reaches the target temperature. 

After your Heater-Shaker step, follow the same steps to deactivate
the temperature and shake functions, open the labware latch, and
move your labware. 

## Temperature Module steps

Adding a Temperature Module step to your protocol displays any labware and adapters currently on the module. Aluminum blocks or a deep well adapter can be used to add labware to the module. Click to set the module state and enter a temperature between 4 and 95 °C. 

After your Temperature module step, add a second step to deactivate the module. Just like in a Heater-Shaker step, you can choose to pause your protocol until the Temperature module reaches the set temperature. 

## Thermocycler Module steps 

Adding a Thermocycler Module step to your protocol opens a
two-part Thermocycler form. First, choose whether to change
the state of the Thermocycler module or to program a profile.
Changes to the module state include simple changes like opening
the lid or setting an initial lid temperature, while programming a
profile sets timed temperature cycles for your experiment.

Click **Change Thermocycler state** to set a block or lid
temperature, or to open or close the lid. You can set the block at
any temperature between 4 and 99 °C and the lid at any
temperature between 37 and 110 °C. 

Click **Program a Thermocycler profile** to choose parameters for
your experiment. Start by entering values for your individual well
volume and initial lid temperature. Click **No profile defined** to open
the profile steps menu.

<figure class="screenshot" markdown>
  ![Thermocycler profile](../images/thermocycler.png)
  <figcaption>Add a cycle of temperature holds within a Thermocycler step.</figcaption>
</figure>

Click **Add step** to create a step, like an initial denaturation, that only needs to happen once. Choose a block temperature, time, and name for your step. 

Cycles are made up of steps that are repeated a set number of times
in your experiment. Click **Add cycle** to add steps to a cycle. At the
bottom of the menu, enter the number of times the cycle should
repeat before saving your work.

When adding a Thermocycler Module step, labware in the module is not automatically displayed. Load labware in the Thermocycler on the protocol starting deck or move your labware to the Thermocycler module in a move step. To move labware to and from the Thermocycler, first open the lid by clicking **Change Thermocycler state**.



