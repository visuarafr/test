// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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

const adminEmail = "yannmartial@visuara.fr";

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOMContentLoaded event fired");
    onAuthStateChanged(auth, async (user) => {
        console.log("onAuthStateChanged event fired");
        if (user) {
            console.log('User is signed in', window.location.pathname);
            try {
                const userId = user.uid;
                console.log("Authenticated user ID:", userId);

                const docRef = doc(db, "clients", userId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const clientData = docSnap.data();
                    console.log("Client data:", clientData);
                    if (document.getElementById('credits-count')) {
                        document.getElementById('credits-count').innerText = clientData.photoCredits;
                    }

                    // Redirection conditionnelle uniquement si sur la page d'accueil
                    if (window.location.pathname.endsWith('/test/index.html') || window.location.pathname === '/test/') {
                        window.location.replace('/test/selection.html');
                    }
                } else {
                    console.log("No such document!");
                    // Affichez un message à l'utilisateur si aucun document utilisateur trouvé
                    alert('No user data found. Please contact support.');
                }
            } catch (error) {
                console.error("Error getting document:", error);
            }
        } else {
            console.log('No user is signed in', window.location.pathname);
            // Redirection conditionnelle uniquement si sur les pages protégées
            if (window.location.pathname.endsWith('/test/dashboard.html') || window.location.pathname.endsWith('/test/selection.html')) {
                window.location.replace('/test/index.html');
            }
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
            // Redirection vers la page de sélection après connexion réussie
            window.location.replace('/test/selection.html');
        })
        .catch(error => {
            console.error("Login error:", error);
            alert(error.message);
        });
}

// Admin Login function
window.adminLogin = function() {
    console.log("Admin login function called");
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(user => {
            if (email === adminEmail) {
                console.log("Admin logged in");
                document.getElementById('admin-section').style.display = 'block';
            } else {
                alert("You are not authorized to access this section.");
                auth.signOut();
            }
        })
        .catch(error => {
            console.error("Admin login error:", error);
            alert(error.message);
        });
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User created with ID:", user.uid);

        // Create a document in Firestore with the same ID as the user
        const docRef = doc(db, "clients", user.uid);
        await setDoc(docRef, clientData);
        console.log("Document successfully written!");
        
        // Inform the admin that the user has been created
        alert('User account created successfully.');
    } catch (error) {
        console.error("Error creating new user:", error);
        alert(error.message);
    }
}
