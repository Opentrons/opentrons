
create_table_ContainerWells = """CREATE TABLE IF NOT EXISTS ContainerWells (
                        container_name TEXT NOT NULL
                            references Containers(name),
                        location TEXT NOT NULL,
                        relative_x INTEGER DEFAULT 0,
                        relative_y INTEGER DEFAULT 0,
                        relative_z INTEGER DEFAULT 0,
                        depth INTEGER NOT NULL,
                        volume INTEGER,
                        diameter INTEGER,
                        length INTEGER,
                        width INTEGER
                    );"""


# TODO: (JG 9/19/17) Use rows and columns for wells in containers
create_table_Containers = """ CREATE TABLE Containers (
                                    name TEXT PRIMARY KEY,
                                    relative_x INTEGER DEFAULT 0,
                                    relative_y INTEGER DEFAULT 0,
                                    relative_z INTEGER DEFAULT 0
                                ); """
