#!/usr/bin/env python

# -*- coding: utf-8 -*-
import re
import sys

from bmaptools.CLI import main

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw|\.exe|\.pyz)?$', '', sys.argv[0])
    sys.exit(main())
