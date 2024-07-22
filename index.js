const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const JSZip = require('jszip');
const cors = require('cors')({ origin: true });

admin.initializeApp();
const storage = new Storage();

exports.generateZip = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const { userId, folderPath } = req.body;

        try {
            const bucket = storage.bucket('YOUR_FIREBASE_STORAGE_BUCKET');
            const [files] = await bucket.getFiles({ prefix: `shootings/${userId}/${folderPath}` });

            const zip = new JSZip();

            for (const file of files) {
                const [buffer] = await file.download();
                zip.file(file.name.split('/').pop(), buffer);
            }

            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

            res.setHeader('Content-Disposition', 'attachment; filename=shooting.zip');
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating ZIP file');
        }
    });
});
