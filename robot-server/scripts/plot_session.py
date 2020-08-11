import argparse
from typing import Dict

import graphviz as gv
from robot_server.robot.calibration.check.session import (
    CalibrationCheckState,
    CHECK_TRANSITIONS
)
from robot_server.robot.calibration.tip_length.constants import (
    TipCalibrationState)
from robot_server.robot.calibration.tip_length.state_machine import (
    TipCalibrationStateMachine)
from robot_server.robot.calibration.deck.constants import (
    DeckCalibrationState)
from robot_server.robot.calibration.deck.state_machine import (
    DeckCalibrationStateMachine)


def build_calibration_check_plot(
        wildcard_separate: bool,
        plot_actions: bool) -> gv.Digraph:
    d = gv.Digraph('Calibration Check Session')
    for state in CalibrationCheckState:
        d.node(state.name, state.value)
    all_states = [s.name for s in CalibrationCheckState]
    if wildcard_separate:
        d.node('*', 'wildcard')
    for edgespec in CHECK_TRANSITIONS:
        fs = edgespec['from_state']
        if isinstance(fs, CalibrationCheckState):
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


def build_tip_length_calibration_plot(
        wildcard_separate: bool,
        plot_actions: bool) -> gv.Digraph:
    d = gv.Digraph('Tip Length Calibration Session')

    tip_cal = TipCalibrationStateMachine()
    for state in tip_cal._state_machine._states:
        d.node(state.name,  state.value)

    uniq_edge_map = {}
    for from_state, to_states_by_command in \
            tip_cal._state_machine._transitions.items():
        if from_state == TipCalibrationState.WILDCARD and \
                not wildcard_separate:
            all_states = (s.name for s in TipCalibrationState)
            for s in all_states:
                d.edge(from_state.name, s.name)
        else:
            for command, ts in to_states_by_command.items():
                edge_key = f'{from_state.name}->{ts.name}'
                existing_edge = uniq_edge_map.get(
                        f'{from_state.name}->{ts.name}', None)
                if existing_edge:
                    uniq_edge_map[edge_key] = \
                        (existing_edge[0], existing_edge[1],
                         f'{existing_edge[2]} | {command.name}')
                else:
                    uniq_edge_map[edge_key] = (from_state.name, ts.name,
                                               command.name)
    for k, v in uniq_edge_map.items():
        fs, ts, c = v
        d.edge(fs, ts, label=c)
    return d


def build_deck_calibration_plot(
        wildcard_separate: bool,
        plot_actions: bool) -> gv.Digraph:
    d = gv.Digraph('Deck Calibration Session')

    deck_cal = DeckCalibrationStateMachine()
    for state in deck_cal._state_machine._states:
        d.node(state.name,  state.value)

    uniq_edge_map = {}
    for from_state, to_states_by_command in \
            deck_cal._state_machine._transitions.items():
        if from_state == DeckCalibrationState.WILDCARD and \
                not wildcard_separate:
            all_states = (s.name for s in DeckCalibrationState)
            for s in all_states:
                d.edge(from_state.name, s.name)
        else:
            for command, ts in to_states_by_command.items():
                edge_key = f'{from_state.name}->{ts.name}'
                existing_edge = uniq_edge_map.get(
                        f'{from_state.name}->{ts.name}', None)
                if existing_edge:
                    uniq_edge_map[edge_key] = \
                        (existing_edge[0], existing_edge[1],
                         f'{existing_edge[2]} | {command.name}')
                else:
                    uniq_edge_map[edge_key] = (from_state.name, ts.name,
                                               command.name)
    for k, v in uniq_edge_map.items():
        fs, ts, c = v
        d.edge(fs, ts, label=c)
    return d


def build_argparser(
        parent: argparse.ArgumentParser = None) -> argparse.ArgumentParser:
    if not parent:
        parent = argparse.ArgumentParser(
            description='Build plots of sessions')
    parent.add_argument('session', metavar='SESSION',
                        choices=['calibration_check',
                                 'tip_length_calibration'
                                 'deck_calibration'],
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
        graph = build_calibration_check_plot(
            not args.wildcard_integrated,
            args.actions)
    elif args.session == 'tip_length_calibration':
        graph = build_tip_length_calibration_plot(
            not args.wildcard_integrated,
            args.actions)
    elif args.session == 'deck_calibration':
        graph = build_deck_calibration_plot(
            not args.wildcard_integrated,
            args.actions)
    graph.format = args.format
    args.output.write(graph.pipe())
