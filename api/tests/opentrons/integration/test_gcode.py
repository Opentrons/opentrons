<<<<<<< HEAD
import difflib
import hashlib
from pprint import pformat
import os
=======
import os
import hashlib
>>>>>>> add gcode test


def test_gcode():
    this_dir = os.path.dirname(__file__)
    res_gcode = os.path.join(this_dir, 'res.gcode')
    expected_gcode = os.path.join(this_dir, 'expected.gcode')
    protocol_file = os.path.join(this_dir, 'protocol.py')

    if os.path.exists(res_gcode):
        os.remove(res_gcode)

    protocol = ''
    with open(protocol_file, 'r') as pf:
        protocol = pf.read()

    os.environ['GCODE_FILE'] = res_gcode
    exec(protocol)
    os.environ['GCODE_FILE'] = ''

    result_hash = hashlib.md5(open(res_gcode, 'rb').read()).hexdigest()
<<<<<<< HEAD
    expected_hash = hashlib.md5(open(expected_gcode, 'rb').read()).hexdigest()

    res = open(res_gcode, 'r').readlines()
    exp = open(expected_gcode, 'r').readlines()

    assert result_hash == expected_hash,\
=======
    rexpected_hash = hashlib.md5(open(expected_gcode, 'rb').read()).hexdigest()

    assert result_hash == rexpected_hash,\
>>>>>>> add gcode test
        """G-CODE test failed. Compare: {0} and {1}'

        Use diff.py for a visual HTML comparison

        e.g.: python {2} {0} {1} -m > gcode-diff.html

        """.format(
            res_gcode, expected_gcode, os.path.join(this_dir, 'diff.py')
<<<<<<< HEAD
        ) + ("""
        {}
        """.format(
            pformat(list(
                difflib.context_diff(
                    res[:100], exp[:100], fromfile='res', tofile='exp'
                )
            )))
        )
=======
        )
>>>>>>> add gcode test
