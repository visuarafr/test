// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBKjWf5lMhM1cfbrPK2ZbkaBOxqYGp7Y",
    authDomain: "demande-shooting.firebaseapp.com",
    projectId: "demande-shooting",
    storageBucket: "demande-shooting.appspot.com",
    messagingSenderId: "445564757883",
    appId: "1:445564757883:web:605f43b55432a46e6483fde"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('request-form').addEventListener('submit', submitRequest);

    onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in
            console.log('User is signed in');
        } else {
            // No user is signed in
            if (window.location.pathname !== '/index.html') {
                window.location = 'index.html';
            }
        }
    });
});

// Login function
window.login = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(user => {
            window.location = 'dashboard.html';
        })
        .catch(error => {
            alert(error.message);
        });
}

// Signup function
window.signup = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(user => {
            window.location = 'dashboard.html';
        })
        .catch(error => {
            alert(error.message);
        });
}

// Function to submit request
function submitRequest(e) {
    e.preventDefault();

    const shootingType = document.getElementById('shootingType').value;
    const date = document.getElementById('date').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const region = document.getElementById('region').value;
    const additionalInfo = document.getElementById('additionalInfo').value;

    addDoc(collection(db, 'requests'), {
        shootingType,
        date,
        address,
        city,
        region,
        additionalInfo,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
    }).then(() => {
        alert('Request submitted!');
        sendToTrello({ shootingType, date, address, city, region, additionalInfo });
    }).catch(error => {
        console.error('Error adding document: ', error);
    });
}

// Function to send request to Trello
function sendToTrello(request) {
    const trelloKey = 'be54e3f7ff2c69550f1ac28b202b7458';
    const trelloToken = 'ATTAc64ad16d6a5dfa2af0d106b42cb1c9ffad6f80ac4c1e3fce4bb03801473eff247EDCE65C';
    const listId = '6650d37d314c2a17bbcf7090'; 

    fetch(`https://api.trello.com/1/cards?key=${trelloKey}&token=${trelloToken}&idList=${listId}&name=${encodeURIComponent('New Request')}&desc=${encodeURIComponent(`Type: ${request.shootingType}\nDate: ${request.date}\nAddress: ${request.address}\nCity: ${request.city}\nRegion: ${request.region}\nAdditional Info: ${request.additionalInfo}`)}`, {
        method: 'POST'
    }).then(response => response.json())
      .then(data => console.log('Trello card created:', data))
      .catch(error => console.error('Error creating Trello card:', error));
}
