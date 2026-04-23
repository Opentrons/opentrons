---
title: "Opentrons Flex: Jupyter Notebook"
description: "Use Jupyter on Flex for interactive protocol development and control."
---

Flex runs a [Jupyter Notebook](https://jupyter.org/) server on port 48888, which you can connect to with your web browser. Use Jupyter to individually run discrete chunks of Python code, called *cells*. This is a convenient environment for writing and debugging protocols, since you can define different parts of your protocol in different notebook cells, and run a single cell at a time.

Access your robot's Jupyter Notebook either:

- In the Opentrons App. Go to **Devices** > your robot > **Robot Settings** > **Advanced** and then click **Launch Jupyter Notebook**.

- In your web browser. Navigate directly to `http://<robot-ip>:48888`, replacing `<robot-ip>` with the local IP address of your Flex.

For more details on using Jupyter, including preparing executable cells
of code and running them on a robot, see the [Jupyter Notebook section](../../python-api/advanced-control/jupyter.md) of the Python Protocol API documentation.