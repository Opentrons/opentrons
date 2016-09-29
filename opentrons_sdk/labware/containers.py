"""
This module provides an interface to other systems (such as the robot itself)
for quering the position of wells and other items within labware equipment,
such as microplates, tipracks, and reservoirs.

The containers aren't stored or defined here, merely aggregated under the
namespace expected by the external API.

For example, `containers.load_container('microplate.96.deepwell')` will load
`microplates.Microplate_96_Deepwell`.  The name that gets passed to the
container is the same as the name that should be defined in the JSON
Protocol file.

There's also support for custom containers, either by placing them in the
config/containers directory of this library (see included examples), or by
using the load_custom_containers function of this module to specify an
alternate configuration directory.
"""





# _load_default_containers()
# containers_path = resource_filename("opentrons_sdk.config", "containers")
# load_custom_containers(containers_path)
#
# containers_path = resource_filename("opentrons_sdk.config", "containers")
# load_legacy_containers_file(
#         os.path.join(containers_path,
#         'legacy_containers.json'
#     )
# )
