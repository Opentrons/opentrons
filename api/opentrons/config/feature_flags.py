import os


def _get_feature_flag(name: str) -> bool:
    return bool(os.environ.get(name))


# short_fixed_trash
# - True ('55.0'): Old (55mm tall) fixed trash
# - False:         77mm tall fixed trash
# - EOL: when all short fixed trash containers have been replaced
def short_fixed_trash(): return _get_feature_flag('OT2_PROBE_HEIGHT')


# split_labware_definitions
# - True:  Use new labware definitions (See: labware_definitions.py and
#          serializers.py)
# - False: Use sqlite db
def split_labware_definitions(): return _get_feature_flag('SPLIT_LABWARE_DEF')
