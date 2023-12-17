jest.mock('sharp', () => {
    // Mock the sharp instance methods
    const mockInstance = {
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('mocked buffer')),
    };

    // Mock the sharp constructor
    const mockSharp = jest.fn(() => mockInstance);

    // Mock the sharp.fit.cover property
    mockSharp.fit = { cover: 'cover' };

    return mockSharp;
});
// Import the necessary testing libraries
const { describe, it, expect, jest: requiredJest } = require('@jest/globals');
const sharp = require('sharp');
const { Storage } = require('@google-cloud/storage');

const Functions = require('../index'); // Adjust the path as needed

// Define your tests
/*
TODO:
✓ Invalid Request Parameters: Test how your function handles requests with missing or invalid parameters. For example, missing bucketName or fileName.

✓ Error Handling for File Download: Simulate an error scenario where the file cannot be downloaded from the bucket. Ensure that your function correctly handles the error and sends an appropriate response.

✓ Image Resizing Logic: Test the image resizing logic with different combinations of width and height parameters. Check if the resizing occurs as expected for each set of parameters.

✓ Image Format Conversion: Verify that the image is correctly converted to WebP format.

✓ Cache-Control Header: Check if the correct Cache-Control header is set in the response.

✓ Saving Processed Image: Test the scenario where a new image size is generated and needs to be saved back to the bucket.

Failure in Image Processing: Simulate a failure in the image processing step (e.g., sharp throws an error) and check if the function handles it correctly.

Non-existent Image: Test how the function behaves when asked to process an image that doesn't exist in the bucket.

Invalid Image Formats: Test the function with different image formats to see how it handles unsupported or corrupt images.

Response Structure: Verify that the structure of the response is as expected, including status codes and any response bodies.

*/
describe('imagesCDN', () => {
    // Test for error handling during file download
    it('handles errors during file download', async () => {
        // Mocking a file download failure
        const mockDownload = jest.fn();
        mockDownload.mockRejectedValue(new Error('Download failed'));
        const mockSave = jest.fn();
        const mockExists = jest.fn();

        jest.spyOn(Storage.prototype, 'bucket').mockImplementation(() => ({
            file: jest.fn(() => ({
                save: mockSave,
                exists: mockExists,
            })),
        }));

        const req = { url: '/bucket-name/nonexistent-file.jpg' };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        await Functions.imagesCDN(req, res);

        // Assertions to check if the error was handled correctly
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.stringContaining('Image not available')
        );
        expect(mockExists).toHaveBeenCalled(); // Ensure the download function was indeed called
    });

    it('successfully processes an new image request', async () => {
        // Local mock setup
        const mockDownload = jest
            .fn()
            .mockResolvedValue([Buffer.from('mocked buffer')]);
        const mockSave = jest.fn();
        const mockExists = jest.fn();
        jest.spyOn(Storage.prototype, 'bucket').mockImplementation(() => ({
            file: jest.fn(() => ({
                download: mockDownload,
                save: mockSave,
                exists: mockExists,
            })),
        }));

        // Import your function after setting up the mocks

        // Mock request and response
        const req = { url: '/bucket-name/file-name_w100_h100.webp' };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            writeHead: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
        };

        // Call the function with the mocked request and response for a new image
        mockExists.mockReturnValueOnce(false);
        await Functions.imagesCDN(req, res);

        // Assertions...
        expect(res.writeHead).toHaveBeenCalledWith(200, {
            'Content-Type': 'image/webp',
        });
        expect(res.end).toHaveBeenCalledWith(expect.any(Buffer), 'binary');
        // Test scenario where the file exists
    });
    it('successfully processes an existing image request', async () => {
        // Local mock setup
        const mockDownload = jest
            .fn()
            .mockResolvedValue([Buffer.from('mocked buffer')]);
        const mockSave = jest.fn();
        const mockExists = jest.fn();
        jest.spyOn(Storage.prototype, 'bucket').mockImplementation(() => ({
            file: jest.fn(() => ({
                download: mockDownload,
                save: mockSave,
                exists: mockExists,
            })),
        }));

        // Import your function after setting up the mocks

        // Mock request and response
        const req = { url: '/bucket-name/file-name_w100_h100.webp' };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            writeHead: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
        };

        mockExists.mockReturnValueOnce(true);

        await Functions.imagesCDN(req, res);
        // Assertions...
        expect(res.writeHead).toHaveBeenCalledWith(200, {
            'Content-Type': 'image/webp',
        });
        expect(res.end).toHaveBeenCalledWith(expect.any(Buffer), 'binary');
    });
    // Test for invalid request parameters
    it('returns a 400 status for invalid request parameters', async () => {
        const req = { url: '/bucket-name' }; // Missing file name
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        await Functions.imagesCDN(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            expect.stringContaining(
                'Both bucket and file parameters are required.'
            )
        );
    });
    it('sets the correct Cache-Control header', async () => {
        // Mock request and response

        const req = { url: '/test-bucket/test-image.jpg' };
        const res = {
            set: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            writeHead: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
        };
        const mockDownload = jest
            .fn()
            .mockResolvedValue([Buffer.from('mocked buffer')]);
        const mockSave = jest.fn();
        const mockExists = jest.fn().mockReturnValue([true]);

        jest.spyOn(Storage.prototype, 'bucket').mockImplementation(() => ({
            file: jest.fn(() => ({
                download: mockDownload,
                save: mockSave,
                exists: mockExists,
            })),
        }));

        // Call the function with the mocked request and response
        await Functions.imagesCDN(req, res);

        // Assertions
        expect(res.set).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=2629440'
        ); // 30.44 days
    });
    it('saves a new image size back to the bucket', async () => {
        // Mock request and response
        const req = { url: '/test-bucket/test-image_w100_h100.webp' };
        const res = {
            set: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            writeHead: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
        };
        const mockDownload = jest
            .fn()
            .mockResolvedValue([Buffer.from('mocked buffer')]);
        const mockSave = jest.fn();
        const mockExists = jest.fn().mockReturnValue(false);
        jest.spyOn(Storage.prototype, 'bucket').mockImplementation(() => ({
            file: jest.fn(() => ({
                download: mockDownload,
                save: mockSave,
                exists: mockExists,
            })),
        }));
        // Call the function with the mocked request and response
        await Functions.imagesCDN(req, res);

        // Assertions
        const fileMock = new (require('@google-cloud/storage').Storage)()
            .bucket()
            .file();

        expect(fileMock.save).toHaveBeenCalledWith(
            Buffer.from('mocked buffer'),
            { contentType: 'image/webp' }
        );
    });
});

// Run tests with Jest
describe('processImage', () => {
    it('should resize image with both width and height', async () => {
        // Call your function
        const result = await Functions.processImage(
            'mocked image buffer',
            100,
            200
        );

        // Assertions
        expect(sharp).toHaveBeenCalledWith('mocked image buffer');
        expect(sharp().resize).toHaveBeenCalledWith({
            width: 100,
            height: 200,
            fit: 'cover',
        });
        expect(result).toEqual(Buffer.from('mocked buffer'));
    });
});

describe('getRequestParams', () => {
    it('extracts bucket name and file name correctly', async () => {
        const url = '/bucket-name/file-name.jpg';
        const params = await Functions.getRequestParams({ url });
        expect(params).toEqual({
            bucketName: 'bucket-name',
            fileName: 'file-name.jpg',
            width: null,
            height: null,
        });
    });

    it('extracts width from the file name', async () => {
        const url = '/bucket-name/file-name_w100.jpg';
        const params = await Functions.getRequestParams({ url });
        expect(params).toEqual({
            bucketName: 'bucket-name',
            fileName: 'file-name_w100.jpg',
            width: 100,
            height: null,
        });
    });

    it('extracts height from the file name', async () => {
        const url = '/bucket-name/file-name_h100.jpg';
        const params = await Functions.getRequestParams({ url });
        expect(params).toEqual({
            bucketName: 'bucket-name',
            fileName: 'file-name_h100.jpg',
            width: null,
            height: 100,
        });
    });

    it('extracts both width and height from the file name', async () => {
        const url = '/bucket-name/file-name_w100_h200.jpg';
        const params = await Functions.getRequestParams({ url });
        expect(params).toEqual({
            bucketName: 'bucket-name',
            fileName: 'file-name_w100_h200.jpg',
            width: 100,
            height: 200,
        });
    });
});
