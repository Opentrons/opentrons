.. _custom_containers:

Custom Containers
=================

To create a custom container, you need to create a JSON file that defines the shape of the container.
Here is an example of a custom container that represents a plate with only 3 circular wells.

.. code-block:: javascript

  {
    "containers" : {
      "tuberack-custom": {
        "locations": {
          "A1": {
            "x": 0,
            "y": 0,
            "z": 0,
            "depth": 30,
            "diameter": 6,
            "total-liquid-volume": 500
          },
          "B1": {
            "x": 20,
            "y": 0,
            "z": 0,
            "depth": 30,
            "diameter": 6,
            "total-liquid-volume": 500
          },
          "C1": {
            "x": 40,
            "y": 0,
            "z": 0,
            "depth": 30,
            "diameter": 6,
            "total-liquid-volume": 500
          }
        }
      }
    }
  }

The first key, "containers", is required in every container file. The next key, "tuberack-custom", is the name of your custom container.
Inside "locations" you can define the x, y, z, depth, diameter, and total-liquid-volume (a volume tracking feature is coming soon).

If you would like to create a container with rectangular wells, simple replace the "diameter" attribute with a "length" and "width" attribute, like so:

.. code-block:: javascript

  {
    "containers" : {
      "trash-square": {
        "locations": {
          "A1": {
            "x": 0,
            "y": 0,
            "z": 0,
            "depth": 35,
            "diameter": 6,
            "total-liquid-volume": 500
          },
        }
      }
    }
  }


In addition, you can include any number of custom containers in a container file - simply add more containers as values of the "containers" key. For example:

.. code-block:: javascript

  {
    "containers" : {
      "trash-square": {
        "locations": {
          "A1": {
            "x": 0,
            "y": 0,
            "z": 0,
            "depth": 35,
            "diameter": 6,
            "total-liquid-volume": 500
          },
        }
      },
      "trash-square": {
        "locations": {
          "A1": {
            "x": 5,
            "y": 10,
            "z": 15,
            "depth": 40,
            "length": 5,
            "width": 10,
            "total-liquid-volume": 538
          }
        }
      }
    }
  }


Lastly, to load a custom container into your app, click "File" and then "Open Containers Folder". Then, drag or copy and paste in the custom container file you wrote in order to access it through a Python or JSON protocol.

Here is an example of loading into a Python protocol the custom trash container that I defined above.

.. code-block:: python

  from opentrons import containers

  custom_trash = containers.load(
      'trash-square',
      'B2'
  )
