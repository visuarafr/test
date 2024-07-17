// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBKjWfl5lMhM1cftbrPK2ZbkaBOxqYGp7Y",
    authDomain: "demande-shooting.firebaseapp.com",
    projectId: "demande-shooting",
    storageBucket: "demande-shooting.appspot.com",
    messagingSenderId: "445564757883",
    appId: "1:445564757883:web:605f43b554324a6e483fde",
    measurementId: "G-RCRMBS7X79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', (event) => {
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', submitRequest);
    }

    onAuthStateChanged(auth, user => {
        console.log('onAuthStateChanged called');
        if (user) {
            // User is signed in
            console.log('User is signed in', window.location.pathname);
            if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
                window.location.replace('/selection.html');
            }
        } else {
            // No user is signed in
            console.log('No user is signed in', window.location.pathname);
            if (window.location.pathname !== '/index.html' && window.location.pathname !== '/' && window.location.pathname !== '/admin_login.html') {
                window.location.replace('/index.html');
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
            window.location.replace('/selection.html');
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
            window.location.replace('/selection.html');
        })
        .catch(error => {
            alert(error.message);
        });
}

// Function to submit request
function submitRequest(e) {
    e.preventDefault();

    const shootingType = document.getElementById('shootingType').value;
    const specificShooting = document.getElementById('specificShooting').value;
    const date = document.getElementById('date').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const additionalInfo = document.getElementById('additionalInfo').value;

    addDoc(collection(db, 'requests'), {
        shootingType,
        specificShooting,
        date,
        address,
        city,
        additionalInfo,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
    }).then(() => {
        alert('Request submitted!');
        sendToTrello({ shootingType, specificShooting, date, address, city, additionalInfo });
    }).catch(error => {
        console.error('Error adding document: ', error);
    });
}

// Function to send request to Trello
function sendToTrello(request) {
    const trelloKey = 'be54e3f7ff2c69550f1ac28b202b7458';
    const trelloToken = 'ATTAc64ad16d6a5dfa2af0d106b42cb1c9ffad6f80ac4c1e3fce4bb03801473eff247EDCE65C';
    const listId = '6650d37d314c2a17bbcf7090'; 

    fetch(`https://api.trello.com/1/cards?key=${trelloKey}&token=${trelloToken}&idList=${listId}&name=${encodeURIComponent('New Request')}&desc=${encodeURIComponent(`Type: ${request.shootingType}\nDate: ${request.date}\nAddress: ${request.address}\nCity: ${request.city}\nAdditional Info: ${request.additionalInfo}`)}`, {
        method: 'POST'
    }).then(response => response.json())
      .then(data => console.log('Trello card created:', data))
      .catch(error => console.error('Error creating Trello card:', error));
}
