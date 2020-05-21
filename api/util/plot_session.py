import argparse
from typing import Dict

import graphviz as gv

from opentrons.server.endpoints import calibration


def build_calibration_check_plot(
        wildcard_separate: bool,
        plot_actions: bool) -> gv.Digraph:
    d = gv.Digraph('Calibration Check Session')
    for state in calibration.session.CalibrationCheckState:
        d.node(state.name, state.value)
    all_states = [s.name for s in calibration.session.CalibrationCheckState]
    if wildcard_separate:
        d.node('*', 'wildcard')
    for edgespec in calibration.session.CHECK_TRANSITIONS:
        fs = edgespec['from_state']
        if isinstance(fs, calibration.session.CalibrationCheckState):
            fs_s = [fs.name]
        elif wildcard_separate:
            fs_s = [fs]
        else:
            fs_s = all_states
        ts = edgespec['to_state']

        kws: Dict[str, str] = {}
        if plot_actions:
            if edgespec.get('before'):
                kws['before'] = edgespec['before']
            if edgespec.get('after'):
                kws['after'] = edgespec['after']
        label = r'\n'.join([edgespec['trigger'].name]
                           + [rf'{k}: {v}' for k, v in kws.items()])
        if edgespec.get('condition'):
            label += rf'\ncondition: {edgespec["condition"]}'
        for f in fs_s:
            d.edge(f, ts, label=label)
    return d


def build_argparser(
        parent: argparse.ArgumentParser = None) -> argparse.ArgumentParser:
    if not parent:
        parent = argparse.ArgumentParser(
            description='Build plots of sessions')
    parent.add_argument('session', metavar='SESSION',
                        choices=['calibration_check'],
                        help='The session to check')
    parent.add_argument('output', metavar='OUTFILE',
                        type=argparse.FileType('wb'),
                        default='session.pdf',
                        nargs='?',
                        help='Where to store the file')
    parent.add_argument(
        '-w', '--wildcard-integrated',
        action='store_true',
        help='Integrate wildcard-based edges into the graph. This will give '
             'a better idea of the true shape but can be very hard to read.')
    parent.add_argument(
        '-a', '--actions',
        action='store_true',
        help='Add labels for before/after actions to edges'
    )
    parent.add_argument(
        '-f', '--format',
        type=str,
        default='pdf',
        help='Select output format (one of https://www.graphviz.org/doc/info/output.html)')
    return parent

if __name__ == '__main__':
    parser = build_argparser()
    args = parser.parse_args()
    if args.session == 'calibration_check':
        graph = build_calibration_check_plot(not args.wildcard_integrated,
                                             args.actions)
        graph.format = args.format
        args.output.write(graph.pipe())
