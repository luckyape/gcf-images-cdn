// Import required libraries
const sharp = require('sharp');
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage client
const storage = new Storage();

// Main function for handling image requests for CDN
const imagesCDN = async (req, res) => {
    // Extract request parameters
    const { bucketName, fileName, width, height } = await getRequestParams(req);
    console.log(
        `Request received for bucket: ${bucketName}, file: ${fileName}, width: ${width}, height: ${height}`
    );

    // Validate request parameters
    if (!bucketName || !fileName) {
        res.status(400).send('Both bucket and file parameters are required.');
        return;
    }

    try {
        // Access the specified bucket
        const bucket = storage.bucket(bucketName);
        console.log(
            `Attempting to download the image ${fileName} from bucket ${bucketName} from storage...`
        );
        // Download the file from the bucket
        //const { imageBuffer, isNew } = await downloadFile(bucket, fileName);
        let requiredFile;
        const requestedFile = bucket.file(fileName);
        const exists = await requestedFile.exists();
        const isNew = !exists[0];
        console.info({ isNew });
        if (isNew) {
            console.log('Requested file name unavailable');
            if (/_w\d+/.test(fileName) || /_h\d+/.test(fileName)) {
                const getOriginalFilename = fileName.replace(
                    /(_h\d+|_w\d+)/g,
                    ''
                );
                requiredFile = bucket.file(getOriginalFilename);
            } else {
                throw Error('File name not found');
            }
        } else {
            requiredFile = requestedFile;
        }
        const imageBuffer = await requiredFile.download();
        console.log('Image downloaded successfully.', { isNew });

        // Process the image (resize, convert to webp, etc.),
        // Set cache control headers for the response &
        // Send the processed image in the response
        const outputBuffer = isNew
            ? await processImage(imageBuffer[0], width, height)
            : imageBuffer[0];
        console.log('Image processing completed.');
        res.set('Cache-Control', 'public, max-age=2629440'); // 30.44 days
        res.writeHead(200, { 'Content-Type': 'image/webp' });
        res.end(outputBuffer, 'binary');

        // Save the processed image back to the bucket, if it's a new size
        if (isNew) {
            const newImage = bucket.file(fileName);
            await newImage.save(outputBuffer, { contentType: 'image/webp' });
            console.log(`Resized image saved back as ${fileName}`);
        }
    } catch (error) {
        // Handle errors in image processing
        console.error(`Image not available: ${error}`);
        res.status(500).send(
            `Image not available:  ${bucketName}, file: ${fileName}, width: ${width}, height: ${height}`
        );
    }
};

// Function to parse request URL and extract parameters
async function getRequestParams({ url }) {
    console.info(`Getting request params for: ${url}`);
    const pathWithoutQuery = url.split('?')[0];
    const [bucketName, ...rest] = pathWithoutQuery.split('/').filter(Boolean);
    const fileName = rest.join('/');

    let { width, height } = extractDimensions(fileName);

    return { bucketName, fileName, height, width };
}
const extractDimensions = (url) => {
    const regex = /w(\d+)_h(\d+)|h(\d+)_w(\d+)|w(\d+)|h(\d+)/;

    const match = url.match(regex);
    if (match) {
        const width =
            match[1] || match[4] || match[5]
                ? parseInt(match[1] || match[4] || match[5])
                : null;
        const height =
            match[2] || match[3] || match[6]
                ? parseInt(match[2] || match[3] || match[6])
                : null;
        return { width, height };
    }
    return { width: null, height: null };
};
// Function to process (resize and convert) the image
async function processImage(inputImage, width = null, height = null) {
    const sharpInstance = sharp(inputImage);

    if (!width && !height) {
        console.log('No width or height provided, converting to WebP.');
        return await sharpInstance.toBuffer();
    }

    const resizeOptions = {};
    if (width) resizeOptions.width = width;
    if (height) resizeOptions.height = height;
    resizeOptions.fit = sharp.fit.cover;

    console.log('Resizing...', resizeOptions);

    const resize = sharpInstance.resize(resizeOptions);
    const buffer = await resize.toBuffer();
    return buffer;
}
module.exports = { processImage, imagesCDN, getRequestParams };
