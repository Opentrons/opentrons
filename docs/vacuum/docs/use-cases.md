---
title: "Vacuum Module: Use Cases"
description: "Stacking deck pieces for filtrate collection and filter-to-waste applications."
---

The Vacuum Module uses a modular deck stack that supports a variety of filtration protocols. By combining specific collars, spacers, and support grids, you can configure the module to either collect samples or extract liquids directly to waste. Selecting the correct stack configuration ensures a reliable, airtight seal across different labware types and protocols.

## Stacking configurations

Each stack configuration helps you control the vertical distance between the sample filter plate and the lower collection plate (or waste manifold). Minimizing the clearance between well plates helps prevents cross-contamination, aerosol/droplet spraying, and ensures clean liquid transfer into target wells.

### With spacers

This stack inserts a short or tall spacer between the vacuum base and collection plate to maintain a uniform gap between the filter and collection well plates. Reducing the vertical distance between the two well plates ensures fluid droplets fall cleanly into the receiving wells. A narrower gap between the plates also prevents negative vacuum pressure from pulling liquid sideways, eliminating cross-contamination between adjacent wells. The short and tall spacers can be paired with either collar.

* **Short spacer (27 mm):** Elevates deep-well collection plates to match standard filter plate heights.
* **Tall spacer (34 mm):** Elevates standard microliter collection plates to bring shallow wells directly under the filter plate nozzles.

From top to bottom, a filtrate collection stack uses the pieces shown below. Always check and test your stack to ensure that a selected combination of pieces is appropriate for a particular protocol.

<figure markdown>
  ![Waste collection stack showing labeled parts](images/stack-filter-to-plate.svg){ width="70%" }
  <figcaption>Filtrate collection stack with spacers</figcaption>
</figure>

### Without spacers

This stack omits spacers altogether to seat a sample filter plate directly on top of a collection well plate. Both plates rest on the vacuum base and are capped by a short or tall collar, which creates a vacuum seal among the stacked components. Stacking well plates without spacers also helps minimize the potential for sample loss or aerosol contamination.

<figure markdown>
  ![Waste collection stack with well plates only, no spacers](images/stack-plate-to-plate.svg){ width="80%" }
  <figcaption>Filtrate collection stack without spacers</figcaption>
</figure>

### Direct to waste

This stack omits both the the spacers and the collection well plate. Instead, the filter plate rests directly on a short or tall collar, which sits on the vacuum base. When under vacuum, this configuration draws liquid through the filter plate and into the carboy.

<figure markdown>
  ![Waste disposal stack showing labeled parts](images/stack-filter-to-waste.svg){ width="80%" }
  <figcaption>Waste disposal stack</figcaption>
</figure>

## Stacking advice and guidelines

Sometimes you may find that different combinations of collars, spacers, and labware don't make a good labware stack. A successful operation often depends on two physical characteristics that allow the module to create and maintain a vacuum seal:

- **Stack height:** The internal stack (spacer and collection plate) must fit inside the collar. If the internal stack is too tall, the bottom of the collar will not sit flush against the vacuum base. If the internal stack is too short, the collection plate cannot seal tightly against the collar's internal gasket.

- **Seal integrity:** All mating or connecting surfaces must sit flush against each other and compress evenly to hold pressure. The filter plate must sit flush against the upper part of the collar's gasket to prevent air leaks. The whole stack should not rock back and forth when placed on the vacuum base.

## Testing a vacuum stack

You can test a vacuum stack with a simple visual examination or via the Python API.

### In the Opentrons App

If stacked components appear to fit flush together, then the stack will probably hold vacuum. Test and verify your specific well plate and vacuum collar combinations by running the vacuum pump using the Opentrons app. A test run can help verify these pieces fit together if the stacked components can reach and hold a targeted vacuum pressure without audible leaks. <font color="red">App directions</font>

### In the Python API

Use the `start_set_vacuum_pressure()` method with a specific pressure, duration, and timeout settings to test stacked components. For example, this snippet can help you create an automated pressure test that will raise an error if the module does not reach -200 mbar in 10 seconds:

```python
test_task = vacuum.start_set_vacuum_pressure(
    gauge_pressure_mbar=-200,
    duration_s=5,
    timeout_s=10,
    vent_after=True,
    equalize_timeout_s=5
)
```
<font color="red"><strong>LINK TO API DOCS FROM HERE OR MOVE AND LINK?</strong></font>