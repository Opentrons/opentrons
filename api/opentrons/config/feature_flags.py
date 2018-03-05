import os


# short_fixed_trash
# - True ('55.0'): Old (55mm tall) fixed trash
# - False: 77mm tall fixed trash
# - EOL: when all short fixed trash containers have been replaced
def short_fixed_trash(): return os.environ.get('OT2_PROBE_HEIGHT', False)
