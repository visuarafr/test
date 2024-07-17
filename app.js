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
    messagingSender
