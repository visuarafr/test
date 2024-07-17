// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, setDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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

// Admin Login function
window.adminLogin = function() {
    console.log("Admin login function called");
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(user => {
            console.log("Admin logged in");
            window.location.replace('create_account.html');
        })
        .catch(error => {
            console.error("Admin login error:", error);
            alert(error.message);
        });
}

// Function to check if the user has admin privileges
async function checkAdminPermissions(user) {
    const docRef = doc(db, "admins", user.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

// Signup function for creating new user accounts by admin
window.signup = async function() {
    console.log("Signup function called");
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const clientData = {
        clientType: "abonnements",
        companyName: document.getElementById('signup-company').value,
        email: email,
        photoCredits: 300,
        subscriptionType: document.getElementById('signup-subscription').value
    };
    
    try {
        const user = auth.currentUser;
        if (user && await checkAdminPermissions(user)) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;
            console.log("User created with ID:", newUser.uid);

            console.log("Attempting to create Firestore document with ID:", newUser.uid);
            const docRef = doc(db, "clients", newUser.uid);
            await setDoc(docRef, clientData);
            console.log("Document successfully written!");

            alert('User account created successfully.');
        } else {
            alert('You do not have admin permissions.');
        }
    } catch (error) {
        console.error("Error creating new user:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert('This email is already in use. Please use a different email.');
        } else if (error.code === 'permission-denied') {
            alert('You do not have permission to perform this action.');
        } else {
            alert('Error creating new user: ' + error.message);
        }
    }
}
