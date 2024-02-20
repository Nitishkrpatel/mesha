import requests
import os
from urllib.parse import urljoin
from bs4 import BeautifulSoup

# Define the URL of the website
url = "https://www.countryflags.com/"

# Send a GET request to the URL
response = requests.get(url)

# Create BeautifulSoup object to parse the HTML content
soup = BeautifulSoup(response.text, "html.parser")

# Create a folder to store the downloaded images
folder_path = "flags"
os.makedirs(folder_path, exist_ok=True)

# Find all image tags in the HTML
image_tags = soup.find_all("img")

# Set to store the downloaded image URLs
downloaded_urls = set()

# Download and save each unique image
for img_tag in image_tags:
    # Get the source URL of the image
    image_url = urljoin(url, img_tag["src"])

    # Check if the image URL starts with "http"
    if image_url.startswith("http"):
        # Check if the image URL has already been downloaded
        if image_url not in downloaded_urls:
            # Add the image URL to the downloaded set
            downloaded_urls.add(image_url)
            # print(image_ur)
            # Extract the image name
            image_name = image_url.split("/")[-1]
            print(image_name)
            # Create the file path to save the image
            image_path = os.path.join(folder_path, image_name)

            # Send a GET request to the image URL
            image_response = requests.get(image_url)

            # Save the image to the specified path
            with open(image_path, "wb") as image_file:
                image_file.write(image_response.content)

            print(f"Downloaded: {image_name}")

print("Image download completed.")
