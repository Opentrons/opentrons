"""Google Drive Tool."""
import os
from typing import Set, Any, Optional
import webbrowser
import mimetypes
from oauth2client.service_account import ServiceAccountCredentials  # type: ignore[import]
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

"""Google Drive Tool.

This module requires a credentials.json file before getting started.
Retrieve from https://console.cloud.google.com/apis/credentials."""


class google_drive:
    """Google Drive Tool."""

    def __init__(self, credentials: Any, folder_name: str, email: str) -> None:
        """Connects to google drive via credentials file."""
        self.scope = ["https://www.googleapis.com/auth/drive"]
        self.credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials, self.scope
        )
        self.drive_service = build("drive", "v3", credentials=self.credentials)
        self.parent_folder = folder_name
        self.email = email
        self.folder = self.open_folder()

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
            "mimeType": str(mimetypes.guess_type(file_path)[0]),
            "parents": [self.parent_folder],
        }
        media = MediaFileUpload(file_path, resumable=True)

        uploaded_file = (
            self.drive_service.files()
            .create(body=file_metadata, media_body=media, fields="id")  # type: ignore
            .execute()
        )
        return uploaded_file["id"]

    def upload_missing_files(self, storage_directory: str) -> None:
        """Upload missing files to Google Drive."""
        # Read Google Drive .json files.
        google_drive_files = self.list_folder()
        google_drive_files_json = [
            file for file in google_drive_files if file.endswith(".json")
        ]
        # Read local directory.
        local_files_json = set(
            file for file in os.listdir(storage_directory) if file.endswith(".json")
        )
        missing_files = local_files_json - set(google_drive_files_json)
        print(f"Missing files: {len(missing_files)}")
        # Upload missing files.
        uploaded_files = []
        for file in missing_files:
            file_path = os.path.join(storage_directory, file)
            uploaded_file_id = google_drive.upload_file(self, file_path)
            self.share_permissions(uploaded_file_id)
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

    def open_folder(self) -> Optional[str]:
        """Open folder in web browser."""
        folder_metadata = (
            self.drive_service.files()
            .get(fileId=self.parent_folder, fields="webViewLink")
            .execute()
        )
        folder_link = folder_metadata.get("webViewLink")
        if folder_link:
            print(f"Folder link: {folder_link}")
            webbrowser.open(
                folder_link
            )  # Open the folder link in the default web browser
        else:
            print("Folder link not found.")
        return folder_link

    def share_permissions(self, file_id: str) -> None:
        """Share permissions with self."""
        new_permission = {
            "type": "user",
            "role": "writer",
            "emailAddress": self.email,
        }
        self.drive_service.permissions().create(
            fileId=file_id, body=new_permission, transferOwnership=False  # type: ignore
        ).execute()
