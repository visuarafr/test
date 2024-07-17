// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(user => {
            window.location = 'dashboard.html';
        })
        .catch(error => {
            alert(error.message);
        });
}

function signup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(user => {
            window.location = 'dashboard.html';
        })
        .catch(error => {
            alert(error.message);
        });
}

document.getElementById('request-form').addEventListener('submit', submitRequest);

function submitRequest(e) {
    e.preventDefault();

    const shootingType = document.getElementById('shootingType').value;
    const date = document.getElementById('date').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const region = document.getElementById('region').value;
    const additionalInfo = document.getElementById('additionalInfo').value;

    db.collection('requests').add({
        shootingType,
        date,
        address,
        city,
        region,
        additionalInfo,
        userId: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Request submitted!');
        sendToTrello({ shootingType, date, address, city, region, additionalInfo });
    }).catch(error => {
        console.error('Error adding document: ', error);
    });
}

function sendToTrello(request) {
    const trelloKey = 'YOUR_TRELLO_KEY';
    const trelloToken = 'YOUR_TRELLO_TOKEN';
    const listId = 'YOUR_TRELLO_LIST_ID';

    fetch(`https://api.trello.com/1/cards?key=${trelloKey}&token=${trelloToken}&idList=${listId}&name=${encodeURIComponent('New Request')}&desc=${encodeURIComponent(`Type: ${request.shootingType}\nDate: ${request.date}\nAddress: ${request.address}\nCity: ${request.city}\nRegion: ${request.region}\nAdditional Info: ${request.additionalInfo}`)}`, {
        method: 'POST'
    }).then(response => response.json())
      .then(data => console.log('Trello card created:', data))
      .catch(error => console.error('Error creating Trello card:', error));
}
