const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')({ origin: true });

admin.initializeApp();
const storage = new Storage();

exports.generateDownloadUrls = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const { userId, folderPath } = req.body;

        try {
            const bucket = storage.bucket('demande-shooting.appspot.com'); // Remplacez par votre bucket Firebase Storage
            const [files] = await bucket.getFiles({ prefix: `shootings/${userId}/${folderPath}` });

            const urls = await Promise.all(files.map(async file => {
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500' // Vous pouvez ajuster cette date d'expiration
                });
                return {
                    name: file.name.split('/').pop(),
                    url
                };
            }));

            res.status(200).json(urls);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating download URLs');
        }
    });
});
