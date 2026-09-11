import sys
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path


async def export_pdf(url, pdf_path, title):
    """
    Navigates to a given file:// URL and saves it as a PDF.
    """

    print(f"Reading from {url}...")
    print(f"Saving PDF to {pdf_path}...")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load the local HTML file
        await page.goto(url, wait_until="networkidle")

        # Generate the PDF with options
        await page.pdf(
            path=pdf_path,
            format="letter",
            display_header_footer=False,
            print_background=True,
            landscape=False,
            scale=1,
            margin={"top": "80px", "bottom": "80px", "left": "30px", "right": "30px"},
        )

        await browser.close()
        print("PDF generation complete.")


def main():
    # Check for correct number of command-line arguments
    if len(sys.argv) != 4:
        print("Usage: python export_to_pdf.py <html_file_path> <pdf_path> <title>")
        print(
            "Example: python export_to_pdf.py site/print_site/index.html my_doc.pdf 'My Document'"
        )
        sys.exit(1)

    # Get arguments from command line
    html_file_path = sys.argv[1]
    pdf_path = sys.argv[2]
    title = sys.argv[3]

    file_path = Path(html_file_path).resolve()

    # Check if the file exists before proceeding
    if not file_path.is_file():
        print(f"Error: File not found at {html_file_path}")
        print(f"       (Resolved to: {file_path})")
        print("Did you run 'mkdocs build' first?")
        sys.exit(1)

    # Convert the Path object to a 'file://' URI
    file_url = file_path.as_uri()

    # Run the async function
    asyncio.run(export_pdf(file_url, pdf_path, title))


if __name__ == "__main__":
    main()
