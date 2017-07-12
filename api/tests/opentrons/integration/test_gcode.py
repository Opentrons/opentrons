import os
import hashlib


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
    expected_hash = hashlib.md5(open(expected_gcode, 'rb').read()).hexdigest()

    import difflib
    from pprint import pformat
    res = open(res_gcode, 'r').readlines()
    exp = open(expected_gcode, 'r').readlines()

    assert result_hash == expected_hash,\
        """G-CODE test failed. Compare: {0} and {1}'

        Use diff.py for a visual HTML comparison

        e.g.: python {2} {0} {1} -m > gcode-diff.html

        """.format(
            res_gcode, expected_gcode, os.path.join(this_dir, 'diff.py')
        ) + ("""
        {}
        """.format(
            pformat(list(
                difflib.context_diff(
                    res[:30], exp[:30], fromfile='res', tofile='exp'
                )
            )[:30]))
        )
