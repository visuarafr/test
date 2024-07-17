// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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
    console.log("DOMContentLoaded event fired");
    onAuthStateChanged(auth, async (user) => {
        console.log("onAuthStateChanged event fired");
        if (user) {
            console.log('User is signed in', window.location.pathname);
            try {
                const docRef = doc(db, "clients", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const clientData = docSnap.data();
                    console.log("Client data:", clientData);
                    document.getElementById('credits-count').innerText = clientData.photoCredits;
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error getting document:", error);
            }
        } else {
            console.log('No user is signed in', window.location.pathname);
        }
    });
});

// Login function
window.login = function() {
    console.log("Login function called");
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(user => {
            console.log("User logged in");
        })
        .catch(error => {
            console.error("Login error:", error);
            alert(error.message);
        });
}
