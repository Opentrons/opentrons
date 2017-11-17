#!/usr/bin/env python

import sys
from itertools import dropwhile, takewhile

START_LINE = '---OT UPDATE BEGIN---\n'
END_LINE = '---OT UPDATE END---\n'

if __name__ == '__main__':
    lines = takewhile(
                lambda s: s != END_LINE,
                dropwhile(lambda s: s != START_LINE, sys.stdin)
            )
    next(lines)
    print(''.join(lines))
