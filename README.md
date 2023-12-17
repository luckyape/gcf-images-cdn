# Google Cloud Function for Image Processing

## Overview
This repository contains a Google Cloud Function (GCF) designed for real-time image processing. It dynamically resizes and converts images to WebP format, using URL parameters to define the required transformations. The function leverages Google Cloud Storage and the Sharp library for efficient image handling, making it ideal for content delivery networks (CDNs).

## Features
- **Dynamic Image Resizing:** Resize images based on URL parameters.
- **Format Conversion:** Converts images to the efficient WebP format.
- **Caching:** Utilizes caching headers to optimize delivery.
- **Google Cloud Integration:** Seamlessly works with Google Cloud Storage.

## Testing
The project includes comprehensive tests using Jest. The testing framework is set up to mock external dependencies, ensuring isolated and reliable testing of the function's logic.

### Test Setup
- **Sharp Library Mocking:** The `sharp` library, used for image processing, is mocked to simulate its behavior.
- **Google Cloud Storage Mocking:** Mocks are used for Google Cloud Storage operations, allowing tests to simulate file storage and retrieval without real network calls.

### Current Test Coverage
- **Invalid Request Parameters:** Verifies handling of requests with missing or invalid parameters.
- **Error Handling:** Simulates errors in file download and tests the response.
- **Image Resizing Logic:** Checks the image resizing functionality with various width and height combinations.
- **Image Format Conversion:** Ensures correct conversion of images to WebP format.
- **Cache-Control Header:** Tests whether the correct Cache-Control header is set.
- **Saving Processed Image:** Simulates saving a new image size to the bucket.

### TODOs
- **Failure in Image Processing:** Need to test the scenario where the image processing step fails.
- **Non-existent Image Handling:** Test behavior for processing images that don't exist in the bucket.
- **Invalid Image Formats:** Expand tests to include handling of unsupported or corrupt image formats.
- **Response Structure Verification:** Improve tests to verify the complete structure and content of the response.

## Installation & Usage
[Provide detailed instructions on how to set up and use the function, including any prerequisites.]

## Contributing
Contributions to improve the function or expand its capabilities are welcome. Please follow the standard Git workflow for contributions and ensure all new features or fixes are adequately tested.
