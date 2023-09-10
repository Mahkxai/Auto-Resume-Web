// Oauth2 Keys
const API_KEY = 'YOUR_API_KEY';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const DISCOVERY_DOC_DRIVE = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let googleDocUrl;
let docxUrl, pdfUrl;

// DOM elements
const buttonSigin = document.getElementById('signin');
const buttonSignout = document.getElementById('signout');
const buttonGetpdf = document.querySelector('.get-doc');
const downloadPdf = document.querySelector('.to-pdf');
const downloadDocx = document.querySelector('.to-docx');
const downloadPng = document.querySelector('.to-png');
const uploadLinkedIn = document.querySelector('.linkedin');
const uploadIndeed = document.querySelector('.indeed');
const uploadSimplify = document.querySelector('.simplify');
const refreshButton = document.querySelector('.button.refresh');

const authContainer = document.getElementById('auth-container');
const canvasContainer = document.getElementById('canvas-container');
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
const btnDonwloadContainer = document.querySelector('.button-container.download');
const btnUploadContainer = document.querySelector('.button-container.upload');

buttonGetpdf.classList.add('disabled-button');

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
    maybeEnableButtons();

}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

/**
 * Callback function for handling the OAuth 2.0 authorization result.
 * @param {Object} authResult - Result of the OAuth 2.0 authorization.
 */
function handleAuthResult(authResult) {
    console.log('Auth Result:', authResult);

    if (authResult && !authResult.error) {
        // Authorization was successful, you can proceed with your application logic here.
        console.log('Authorization successful:', authResult);
    } else {
        // Authorization failed or was denied by the user.
        console.error('Authorization error:', authResult.error);
    }
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        buttonSigin.style.visibility = 'visible';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        console.log("success");
        buttonSigin.classList.add('toggle');
        buttonSignout.classList.add('toggle');
        buttonGetpdf.classList.remove('disabled-button');

        // await listFiles();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
    buttonGetpdf.classList.add('disabled-button');
    resetAnimations();

    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
}

buttonGetpdf.addEventListener('click', () => {
    if (gapi.client.getToken() === null) {
        alert("Sign In First!");
        return;
    }

    // Reset animation on each click
    resetAnimations(true);

    // Get URL from input
    googleDocUrl = document.getElementById("url").value;

    if (googleDocUrl === "") {
        alert("URL is not valid or empty. Make sure you have included http:// or https:// in the URL.");
        return;
    } else {
        const mimeTypeDocx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const mimeTypePdf = 'application/pdf';

        const fileId = extractGoogleDocsId(googleDocUrl);

        if (fileId !== null) {
            // Display PDF Content
            gapi.client.drive.files.export({
                fileId: fileId,
                mimeType: mimeTypePdf
            }).then((response) => {
                const pdfData = response.body;
                displayPDF(pdfData);
            }).catch((error) => {
                console.error('Error exporting Google Doc as PDF:', error);
            });

            // get download URLs
            gapi.client.drive.files.get({
                fileId: fileId,
                fields: 'webViewLink, exportLinks',
            }).then(function (response) {
                const exportLinks = response.result.exportLinks;
                docxUrl = exportLinks[mimeTypeDocx];
                pdfUrl = exportLinks[mimeTypePdf];
            }).catch(function (error) {
                console.error('Error getting download URL:', error);
            });
        }
    }

    // Get the fileId from google docs link
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

    // Render pdf from mimetype file using PDF.js library
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
                animate();
            });
        });
    }
});

downloadDocx.addEventListener('click', function () {
    downloadFile(docxUrl, '.docx');
});

downloadPdf.addEventListener('click', function () {
    downloadFile(pdfUrl, '.pdf');
});

downloadPng.addEventListener('click', () => {
    var dataURL = canvas.toDataURL("image/png");
    var a = document.createElement("a");
    a.href = dataURL;
    a.download = "Hardik_Resume.png";
    a.click();
});

uploadLinkedIn.addEventListener('click', function () {
    openWebsite('LinkedIn')
});
uploadIndeed.addEventListener('click', function () {
    openWebsite('Indeed')
});

uploadSimplify.addEventListener('click', function () {
    openWebsite('Simplify')
});

refreshButton.addEventListener('click', function () {
    handleSignoutClick();
});

function downloadFile(downloadUrl, fileExt) {
    const fileName = 'Hardik_Resume'
    const token = gapi.client.getToken();
    if (token !== null) {
        const accessToken = token.access_token;
        if (downloadUrl) {
            fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }).then(function (response) {
                if (response.ok) {
                    response.blob().then(function (blob) {
                        console.log('File content:', blob);
                        const fileBlob = blob
                        // Create a download link element
                        const downloadLink = document.createElement('a');
                        downloadLink.href = window.URL.createObjectURL(fileBlob);
                        downloadLink.download = fileName + fileExt; // Set the desired filename with the appropriate extension
                        downloadLink.click();
                        window.URL.revokeObjectURL(downloadLink.href);
                    });
                } else {
                    console.error('Error downloading file:', response.statusText);
                }
            }).catch(function (error) {
                console.error('Fetch error:', error);
            });
        } else {
            console.error('Download URL not found.');
        }
    }
}

function openWebsite(website) {
    var url = {};

    url["LinkedIn"] = "https://www.linkedin.com/jobs/application-settings";
    url["Indeed"] = "https://profile.indeed.com/?hl=en_US&co=US&from=gnav-passport--passport-webapp";
    url["Simplify"] = "https://simplify.jobs/profile/e3e281de-1d3d-4be2-bb75-36a770bca7ba";

    var newWindow = window.open(url[website], '_blank', 'width=800,height=600');

    if (newWindow) {
        newWindow.focus();
    } else {
        alert('Unable to open the website. Please check your popup blocker settings.');
    }
}

// Return screen to original state using animation
function resetAnimations(signedin = false) {
    authContainer.classList.remove('print');
    canvas.classList.remove('print');
    if (!signedin) {
        buttonSigin.classList.remove('toggle');
        buttonSignout.classList.remove('toggle');
    }
    btnDonwloadContainer.classList.remove('visible');
    btnUploadContainer.classList.remove('visible');
    canvasContainer.style.maxHeight = '0'
    canvasContainer.classList.remove('zoom');
}

function animate() {
    authContainer.classList.add('print');
    canvas.classList.add('print');
    buttonSigin.classList.add('toggle');
    buttonSignout.classList.add('toggle');
    btnDonwloadContainer.classList.add('visible');
    btnUploadContainer.classList.add('visible');
    canvasContainer.style.maxHeight = '72vh';
}

// Get references to the popup and buttons
const popup = document.getElementById('myPopup');
const showPopupBtn = document.getElementById('showPopupBtn');
const closePopupBtn = document.getElementById('closePopupBtn');

const overlay = document.getElementById('overlay');

canvasContainer.addEventListener('click', () => {
    console.log('Click event triggered'); // Check if this message appears in the console
    canvasContainer.classList.toggle('zoom');
});