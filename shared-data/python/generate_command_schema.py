from opentrons import protocol_engine

for n,c in dict([(name, cls) for name, cls in protocol_engine.commands.__dict__.items() if isinstance(cls, type)]):
  print(n)
