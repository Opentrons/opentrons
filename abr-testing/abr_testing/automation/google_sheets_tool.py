"""Google Sheet Tool."""
import gspread  # type: ignore[import]
import socket
import httplib2
import time as t
import sys
from datetime import datetime
from oauth2client.service_account import ServiceAccountCredentials  # type: ignore[import]
from typing import Dict, List, Any, Set, Tuple

"""Google Sheets Tool.

This module requires a credentials.json file before getting started.
Retrieve from https://console.cloud.google.com/apis/credentials.
"""


class google_sheet:
    """Google Sheets Tool."""

    def __init__(self, credentials: Any, file_name: str, tab_number: int) -> None:
        """Connects to google sheet via credentials file."""
        try:
            self.scope = [
                "https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive",
            ]
            self.credentials = ServiceAccountCredentials.from_json_keyfile_name(
                credentials, self.scope
            )
            self.gc = gspread.authorize(self.credentials)
            self.file_name = file_name
            self.tab_number = tab_number
            self.spread_sheet = self.open_google_sheet()
            self.worksheet = self.open_worksheet(self.tab_number)
            self.row_index = 1
            print(f"Connected to google sheet: {self.file_name}")
        except gspread.exceptions.APIError:
            print("ERROR: Check google sheet name. Check credentials file.")
            sys.exit()

    def open_google_sheet(self) -> Any:
        """Open Google Spread Sheet."""
        sheet = self.gc.open(self.file_name)
        return sheet

    def open_worksheet(self, tab_number: int) -> Any:
        """Open individual worksheet within a googlesheet."""
        return self.spread_sheet.get_worksheet(tab_number)

    def create_worksheet(self, tab_name: int) -> None:
        """Create a worksheet with tab name. Existing spreadsheet needed."""
        try:
            self.spread_sheet.add_worksheet(tab_name, rows="1000", cols="26")
        except gspread.exceptions.APIError:
            print("Work Sheet already exists")

    def write_header(self, header: List) -> None:
        """Write Header to first row if not present."""
        header_list = self.worksheet.row_values(1)
        if header_list != header:
            self.worksheet.insert_row(header, self.row_index)

    def write_to_row(self, data: List) -> None:
        """Write data into a row in a List[] format."""
        try:
            self.row_index += 1
            data = [
                item.strftime("%Y/%m/%d %H:%M:%S")
                if isinstance(item, datetime)
                else item
                for item in data
            ]
            self.worksheet.insert_row(data, index=self.row_index)
        except socket.gaierror:
            pass
        except httplib2.ServerNotFoundError:
            print("UNABLE TO CONNECT TO SERVER!!, CHECK CONNECTION")
        except Exception as error:
            print(error.__traceback__)
        except gspread.exceptions.APIError:
            print("Write quotes exceeded. Waiting 30 sec before writing.")
            t.sleep(30)
            self.worksheet.insert_row(data, index=self.row_index)

    def delete_row(self, row_index: int) -> None:
        """Delete Row from google sheet."""
        self.worksheet.delete_rows(row_index)

    def update_cell(
        self, row: int, column: int, single_data: Any
    ) -> Tuple[int, int, Any]:
        """Update ONE individual cell according to a row and column."""
        self.worksheet.update_cell(row, column, single_data)
        return row, column, single_data

    def get_all_data(self) -> Dict[str, Any]:
        """Get all the Data recorded from worksheet."""
        return self.worksheet.get_all_records()

    def get_column(self, column_number: int) -> Set[str]:
        """Get all values in column."""
        return self.worksheet.col_values(column_number)

    def get_index_row(self) -> int:
        """Check for the next available row to write too."""
        row_index = len(self.get_column(1))
        print(f"Row Index: {row_index} recorded on google sheet.")
        return row_index

    def update_row_index(self) -> None:
        """Update self.row_index instance variable."""
        self.row_index = self.get_index_row()

    def get_all_sheets(self) -> List[str]:
        """List all tabs in the spreadsheets."""
        worksheets = self.spread_sheet.worksheets()
        return worksheets

    def get_sheet_by_name(self, title: str) -> None:
        """Reference sheet by name."""
        try:
            worksheet = self.spread_sheet.worksheet(title)
            return worksheet
        except gspread.exceptions.WorksheetNotFound:
            raise gspread.exceptions.WorksheetNotFound(
                "Worksheet does not exist!!, Use create_worksheet() function first."
            )

    def token_check(self) -> None:
        """Check if still credentials are still logged in."""
        if self.credentials.access_token_expired:
            self.gc.login()

    def get_row_index_with_value(self, some_string: str, col_num: int) -> Any:
        """Find row index of string by looking in specific column."""
        cell = self.worksheet.find(some_string, in_column=col_num)
        try:
            row_index = int(cell.row)
        except AttributeError:
            print("Row not found.")
            return None
        return row_index
    
    def create__line_chart(self, titles: List[str], series: List[Dict[str, Any]], spreadsheet_id: str):
        """Create chart of data on google sheet."""
        chart_data = {
                        "chart": {
                        "spec": {
                            "title": titles[0],
                            "basicChart": {
                            "chartType": "LINE",
                            "legendPosition": "BOTTOM_LEGEND",
                            "axis": [
                                {
                                "position": "BOTTOM_AXIS",
                                "title": titles[1]
                                },
                                {
                                "position": "LEFT_AXIS",
                                "title": titles[2]
                                }
                            ],
                            "ranges": [
                                series
                            ],
                            "headerCount": 1
                            }
                        },
                        "position": {
                            "newSheet": True
                        }
                        }
                    }
        body = {"requests": [{"addChart": {"chart": chart_data}}]}
        self.batchUpdate(spreadsheet_id, body = body).execute()
