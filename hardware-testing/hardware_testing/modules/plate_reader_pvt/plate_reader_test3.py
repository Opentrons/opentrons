import os
import numpy as np
import pandas as pd

target_file_path = input('输入测试目录：例如 -> ./2025-4-1/OPTMAA00037 :')  # 替换这个目录

Folder = os.path.join(os.getcwd(), target_file_path.strip()).replace("\\", '/')


cal_values_450nm = np.array([
    [0., 0., 0.2437, 0.2437, 0.4877, 0.4877, 1.0014, 1.0014, 1.529, 1.529, 2.533, 2.533],
    [0., 0., 0.2437, 0.2437, 0.4881, 0.4881, 1.0012, 1.0012, 1.5293, 1.5293, 2.532, 2.532],
    [0., 0., 0.2436, 0.2436, 0.4887, 0.4887, 1.0012, 1.0012, 1.529, 1.529, 2.532, 2.532],
    [0., 0., 0.2436, 0.2436, 0.4894, 0.4894, 1.0012, 1.0012, 1.5294, 1.5294, 2.532, 2.532],
    [0., 0., 0.2435, 0.2435, 0.4896, 0.4896, 1.0011, 1.0011, 1.5301, 1.5301, 2.532, 2.532],
    [0., 0., 0.2434, 0.2434, 0.4896, 0.4896, 1.0012, 1.0012, 1.5307, 1.5307, 2.531, 2.531],
    [0., 0., 0.2435, 0.2435, 0.4897, 0.4897, 1.0011, 1.0011, 1.5311, 1.5311, 2.53, 2.53],
    [0., 0., 0.2436, 0.2436, 0.4893, 0.4893, 1.001, 1.001, 1.5303, 1.5303, 2.531, 2.531]
])

cal_values_650nm = np.array([
    [0., 0., 0.2974, 0.2974, 0.5659, 0.5659, 1.0057, 1.0057, 1.4277, 1.4277, 2.366, 2.366],
    [0., 0., 0.2974, 0.2974, 0.5665, 0.5665, 1.0056, 1.0056, 1.4276, 1.4276, 2.366, 2.366],
    [0., 0., 0.2971, 0.2971, 0.5671, 0.5671, 1.0056, 1.0056, 1.4276, 1.4276, 2.365, 2.365],
    [0., 0., 0.2971, 0.2971, 0.5678, 0.5678, 1.0057, 1.0057, 1.4277, 1.4277, 2.365, 2.365],
    [0., 0., 0.2969, 0.2969, 0.5681, 0.5681, 1.0055, 1.0055, 1.4287, 1.4287, 2.365, 2.365],
    [0., 0., 0.2968, 0.2968, 0.568, 0.568, 1.0057, 1.0057, 1.4291, 1.4291, 2.365, 2.365],
    [0., 0., 0.2968, 0.2968, 0.568, 0.568, 1.0056, 1.0056, 1.4293, 1.4293, 2.364, 2.364],
    [0., 0., 0.2969, 0.2969, 0.5675, 0.5675, 1.0054, 1.0054, 1.4285, 1.4285, 2.365, 2.365]
])

cal_tolerances = np.array(
    [0., 0., 0.0024, 0.0024, 0.0034, 0.0034, 0.0034, 0.0034, 0.0068, 0.0068, 0.012, 0.012]
)


class PlateReaderCSV:
    def __init__(self):
        self.target_folder = Folder
        self.number_to_row = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        self.result = True

    def open_files(self):
        data_files = {}
        for file in os.listdir(self.target_folder):
            if "_03_" in file:
                temp = {file: os.path.join(Folder, file).replace('\\', '/')}
                data_files.update(temp)
        return data_files

    def find_errors_from_array(self, arr):
        # 找出所有 False 的行和列
        rows, cols = np.where(arr == False)  # 或者直接 np.where(~a)

        # 打印结果
        fails = []
        for row, col in zip(rows, cols):
            fails.append(f'{self.number_to_row[row]}{col+1}')
        print(f"3. Fail 位于 {fails}\n")

    def data_handler(self, file_path: str, cal_values, wave_len, deg) -> None:
        """

        :param file_path:
        :type file_path:
        :param cal_values:
        :type cal_values:
        :param wave_len:
        :type wave_len:
        :param deg:
        :type deg:
        :return:
        :rtype:
        """
        df = pd.read_csv(file_path, encoding='gbk')
        df = df.set_index(df.columns[0])
        sn = df.iloc[23, 0]
        test_datas = df.iloc[0:8, 0:13]
        print(f"\n{'*'*12}load {sn}... {wave_len}nm, {deg} deg{'*'*12}")
        test_datas = np.float32(test_datas.to_numpy())

        accuracy_tolerances = np.zeros((8, 12))
        accuracy_tolerances[:, :10] = cal_values[:, :10] * 0.010 + cal_tolerances[:10] + 0.01
        accuracy_tolerances[:, 10:] = cal_values[:, 10:] * 0.015 + cal_tolerances[10:] + 0.01
        accuracy_tolerances = np.zeros((8, 12))
        accuracy_tolerances[:, :10] = cal_values[:, :10] * 0.010 + cal_tolerances[:10] + 0.01
        accuracy_tolerances[:, 10:] = cal_values[:, 10:] * 0.015 + cal_tolerances[10:] + 0.01

        if deg is 0:
            cal_values = np.flip(cal_values)
            accuracy_tolerances = np.flip(accuracy_tolerances)

        within_tolerance = np.isclose(test_datas, cal_values, atol=accuracy_tolerances)
        # count the fails and showing the position
        errors = np.count_nonzero(within_tolerance == False)
        result = True if errors == 0 else False
        self.result = self.result and result
        result = 'Pass' if result else 'Fail'
        print(f'1. Test {result}')
        print(f"2. Finding {errors}x error wells")
        self.find_errors_from_array(within_tolerance)

        result = np.where(within_tolerance, "Pass", "Fail")  # a 为 True 时选 "Pass"，否则选 "Fail"
        print("  " + ' '.join([str(i+1)+' '*(4-len(str(i+1))) for i in range(12)]) )
        for index, row in enumerate(result):
            print(f'{self.number_to_row[index]} ' + ' '.join(row))



    def data_analysis(self):
        """
        处理测试数据
        """
        data_files = self.open_files()
        for key, value in data_files.items():
            if "_0deg" in key and "450nm" in key:
                self.data_handler(value, cal_values=cal_values_450nm, wave_len=450, deg=0)
            elif "_0deg" in key and "650nm" in key:
                self.data_handler(value, cal_values=cal_values_650nm, wave_len=650, deg=0)
            elif "_180deg" in key and "450nm" in key:
                self.data_handler(value, cal_values=cal_values_450nm, wave_len=450, deg=180)
            elif "_180deg" in key and "650nm" in key:
                self.data_handler(value, cal_values=cal_values_650nm, wave_len=650, deg=180)
            else:
                pass

    def main_loop(self):
        self.data_analysis()
        result = 'Pass' if self.result else 'Fail'
        print(f'\nResult: {result} !')


if __name__ == '__main__':
    pr = PlateReaderCSV()
    pr.main_loop()
