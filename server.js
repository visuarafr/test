const express = require('express');
const { Storage } = require('@google-cloud/storage');
const nodemailer = require('nodemailer');
const JSZip = require('jszip');
const stream = require('stream');

const app = express();
const port = process.env.PORT || 3000;

// Configurez votre projet Google Cloud Storage
const storage = new Storage({
  projectId: 'YOUR_PROJECT_ID',
  keyFilename: 'PATH_TO_YOUR_SERVICE_ACCOUNT_KEY.json'
});

// Nodemailer transporteur pour envoyer des e-mails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_EMAIL@gmail.com',
    pass: 'YOUR_EMAIL_PASSWORD'
  }
});

app.use(express.json());

app.post('/send-email', async (req, res) => {
  const { userId, folderPath, email } = req.body;

  try {
    const bucket = storage.bucket('YOUR_FIREBASE_STORAGE_BUCKET');
    const [files] = await bucket.getFiles({ prefix: `shootings/${userId}/${folderPath}` });

    const zip = new JSZip();

    const downloadPromises = files.map(async (file) => {
      const [buffer] = await file.download();
      zip.file(file.name.split('/').pop(), buffer);
    });

    await Promise.all(downloadPromises);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const mailOptions = {
      from: 'YOUR_EMAIL@gmail.com',
      to: email,
      subject: 'Your Shooting Files',
      text: 'Here are your shooting files.',
      attachments: [
        {
          filename: `${folderPath}.zip`,
          content: zipBuffer
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
