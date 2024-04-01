"""Google Drive Tool."""
import os
from typing import Set, Any
from oauth2client.service_account import ServiceAccountCredentials  # type: ignore[import]
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

"""Google Drive Tool.

This module requires a credentials.json file before getting started.
Retrieve from https://console.cloud.google.com/apis/credentials."""


class google_drive:
    """Google Drive Tool."""

    def __init__(self, credentials: Any, folder_name: str, parent_folder: Any) -> None:
        """Connects to google drive via credentials file."""
        self.scope = ["https://www.googleapis.com/auth/drive"]
        self.credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials, self.scope
        )
        self.drive_service = build("drive", "v3", credentials=self.credentials)
        self.folder_name = folder_name
        self.parent_folder = parent_folder

    def list_folder(self, delete: Any = False) -> Set[str]:
        """List folders and files in Google Drive."""
        file_names = set()
        page_token: str = ""
        while True:
            results = (
                self.drive_service.files()
                .list(
                    q=f"'{self.parent_folder}' in parents and trashed=false"
                    if self.parent_folder
                    else ""  # type: ignore
                    if self.parent_folder
                    else None,
                    pageSize=1000,
                    fields="nextPageToken, files(id, name, mimeType)",
                    pageToken=page_token,
                )
                .execute()
            )
            items = results.get("files", [])
            if not items:
                break
            for item in items:
                item_name = item["name"]
                if delete:
                    self.delete_files(item["id"])
                file_names.add(item_name)
            page_token = results.get("nextPageToken", "")
            if len(page_token) < 1:
                break
            if not file_names:
                print("No folders or files found in Google Drive.")
        print(f"{len(file_names)} item(s) in Google Drive")
        return file_names

    def delete_files(self, file_or_folder_id: str) -> None:
        """Delete a file or folder in Google Drive by ID."""
        try:
            self.drive_service.files().delete(fileId=file_or_folder_id).execute()
            print(f"Successfully deleted file/folder with ID: {file_or_folder_id}")
        except Exception as e:
            print(f"Error deleting file/folder with ID: {file_or_folder_id}")
            print(f"Error details: {str(e)}")

    def upload_file(self, file_path: str) -> str:
        """Upload file to Google Drive."""
        file_metadata = {
            "name": os.path.basename(file_path),
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [self.parent_folder] if self.parent_folder else "",
        }

        media = MediaFileUpload(file_path, resumable=True)

        uploaded_file = (
            self.drive_service.files()
            .create(body=file_metadata, media_body=media, fields="id")  # type: ignore
            .execute()
        )

        return uploaded_file["id"]

    def upload_missing_files(self, storage_directory: str, missing_files: set) -> None:
        """Upload missing files to Google Drive."""
        uploaded_files = []
        for file in missing_files:
            file_path = os.path.join(storage_directory, file)
            uploaded_file_id = google_drive.upload_file(self, file_path)
            uploaded_files.append(
                {"name": os.path.basename(file_path), "id": uploaded_file_id}
            )
        # Fetch the updated file list after all files are uploaded
        files = google_drive.list_folder(self)
        file_names = [file for file in files]
        for uploaded_file in uploaded_files:
            this_name = uploaded_file["name"]
            if this_name in file_names:
                print(
                    f"File '{this_name}' was successfully uploaded with ID: {uploaded_file['id']}"
                )
            else:
                print(
                    f"File '{this_name}' was not found in the list of files after uploading."
                )
