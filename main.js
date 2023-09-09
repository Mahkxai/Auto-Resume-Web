// TO-DO: Configure Google Cloud Console and get Authentication and Authorization keys
const API_KEY = 'YOUR_API_KEY';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const DISCOVERY_DOC_DRIVE = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;


/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC_DRIVE],
    });
    gapiInited = true;
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
}

// Get DOM elements to hold the PDF viewer
// const container = document.getElementById('canvas-container')
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
const buttonGetpdf = document.querySelector('.get-doc');
const btnDonwloadContainer = document.querySelector('.button-container.download');
const btnUploadContainer = document.querySelector('.button-container.upload');

buttonGetpdf.addEventListener('click', () => {
    // Reset "printer" animation on each click
    resetAnimations();

    // Get URL from input
    const googleDocUrl = document.getElementById("url").value;

    if (googleDocUrl === "") {
        alert("URL is not valid or empty. Make sure you have included http:// or https:// in the URL.");
        return;
    } else {
        const FILE_ID = extractGoogleDocsId(googleDocUrl);
        console.log("Document ID: ", FILE_ID);

        if (FILE_ID === null) return;

        gapi.client.drive.files.export({
            fileId: FILE_ID,
            mimeType: 'application/pdf'
        }).then((response) => {
            const pdfData = response.body;
            displayPDF(pdfData);
        }).catch((error) => {
            console.error('Error exporting Google Doc as PDF:', error);
        });
    }

    function extractGoogleDocsId(url) {
        // Define the regular expression pattern to match Google Docs URLs
        var pattern = /\/d\/(.*?)\//;

        // Use the regular expression to extract the document ID
        var match = url.match(pattern);

        if (match && match[1]) {
            // Extracted document ID is in match[1]
            return match[1];
        } else {
            alert("Not a valid Google Docs URL");
            return null;
        }
    }

    function displayPDF(pdfData) {
        // Initialize PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

        // Load the PDF document
        pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf) => {
            // Fetch the first page
            pdf.getPage(1).then((page) => {
                // Set the canvas dimensions to match the PDF page
                const viewport = page.getViewport({ scale: 2 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render the PDF page on the canvas
                page.render({
                    canvasContext: context,
                    viewport: viewport,
                });

                // Enable the pdf canvas
                canvas.classList.add('print');
                btnDonwloadContainer.classList.add('visible');
                btnUploadContainer.classList.add('visible');
            });
        });
    }

    // // Test to display drive files
    // gapi.client.drive.files.list({
    //     'pageSize': 10,
    //     'fields': 'files(id, name)',
    // }).then((response) => {
    //     const files = response.result.files;
    //     if (!files || files.length == 0) {
    //         console.log('No files found.');
    //         return;
    //     }

    //     // Flatten to string to display
    //     const output = files.reduce(
    //         (str, file) => `${str}${file.name} (${file.id})\n`,
    //         'Files:\n');
    //     console.log(output)

    // }).catch((error) => {
    //     console.error('Error exporting Google Doc as PDF:', error);
    // });
});

function resetAnimations() {
    canvas.classList.remove('print');
    btnDonwloadContainer.classList.remove('visible');
    btnUploadContainer.classList.remove('visible');
}

// Get a reference to the refresh button by its id
const refreshButton = document.querySelector('.button.refresh');

// Add a click event listener to reload the page when the button is clicked
refreshButton.addEventListener('click', function () {
    resetAnimations();
    // location.reload();
});