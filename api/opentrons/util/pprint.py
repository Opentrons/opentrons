import functools
from opentrons import containers


def get_container(slot):
    res = [None] + [
        c for c in slot.get_all_children()
        if isinstance(c, containers.Container)]
    return res.pop()


def container_name(slot):
    c = get_container(slot)
    return c.get_name() if c else ''


def container_type(slot):
    c = get_container(slot)
    return c.get_type() if c else ''


def format_slot(slot, height, width, top_margin):
    res = []
    content_string = '|{:' + str(width-2) + 's}|'

    divider = ['+{}+'.format('-'*(width-2))]
    res += divider

    for _ in range(top_margin-1):
        res += [content_string.format('')]

    res += [
        content_string.format(slot.get_name()),
        content_string.format(container_name(slot)),
        content_string.format(container_type(slot))
    ]

    res += divider

    return res


def join_cols(a, b):
    return [
        line_a[:-1] + line_b
        for line_a, line_b in zip(a, b)
    ]


def join_rows(a, b):
    return a[:-1] + b


def stringify_deck(formatted_slots, n, m):
    rows = [
        [formatted_slots.pop() for _ in range(n)]
        for _ in range(m)
    ]

    output_rows = [
        functools.reduce(join_cols, row)
        for row in rows
    ]

    return functools.reduce(join_rows, output_rows)


def pprint(deck):
    # Determine dimensions given the number of slots
    size_map = {
        10: (5, 2),
        15: (5, 3)
    }

    # Get all slots on a deck
    deck = [
        c for c in deck.get_all_children()
        if isinstance(c, containers.Slot)
    ]

    if not len(deck) in size_map:
        raise ValueError(
            ('Unexpected deck size. Expected 10 ',
             'slots for Hood or 15 slots for other'))

    # Get all string labels of everything we'll be printing
    # to calculate cell width
    labels = sum([
        [slot.get_name(), container_name(slot), container_type(slot)]
        for slot in deck], [])

    slot_width = max([len(s) for s in labels]) + 10
    slot_height = slot_width

    N, M = size_map[len(deck)]

    # Transpose the deck
    # TODO: make sure order of slots on the deck doesn't affect us
    deck = [
        deck[row + col * M]
        for row in range(M)
        for col in reversed(range(N))
    ]

    pretty_slots = [
        format_slot(slot, slot_height, slot_width, 2)
        for slot in deck]

    print('\n'.join(stringify_deck(pretty_slots, N, M)))
