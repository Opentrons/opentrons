import os
import traceback
def remove_folder(folder):
    for file in os.listdir(folder):
        try:
            file_path = os.path.join(folder, file)
            os.remove(file_path)
        except:
            print("Can not remove file")
            traceback.print_exc()
    os.rmdir(folder)