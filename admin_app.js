// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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

const adminEmail = "yannmartial@visuara.fr"; // Replace with the actual admin email

window.adminLogin = function() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            const user = userCredential.user;
            if (user.email === adminEmail) {
                window.location = 'create_account.html';
            } else {
                alert("Vous n'avez pas l'autorisation d'accéder à cette page.");
                auth.signOut();
            }
        })
        .catch(error => {
            alert(error.message);
        });
};

window.toggleSubscriptionOptions = function() {
    const clientType = document.getElementById('clientType').value;
    const subscriptionOptions = document.getElementById('subscriptionOptions');
    if (clientType === 'abonnements') {
        subscriptionOptions.style.display = 'block';
    } else {
        subscriptionOptions.style.display = 'none';
    }
};

document.getElementById('create-account-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const clientEmail = document.getElementById('clientEmail').value;
    const companyName = document.getElementById('companyName').value;
    const clientType = document.getElementById('clientType').value;
    const subscriptionType = clientType === 'abonnements' ? document.getElementById('subscriptionType').value : null;

    createUserWithEmailAndPassword(auth, clientEmail, "temporaryPassword123") // Use a temporary password
        .then(userCredential => {
            const user = userCredential.user;

            addDoc(collection(db, 'clients'), {
                email: clientEmail,
                companyName,
                clientType,
                subscriptionType,
                photoCredits: subscriptionType ? getPhotoCredits(subscriptionType) : null
            }).then(() => {
                alert('Compte client créé avec succès !');
                sendPasswordResetEmail(auth, clientEmail)
                    .then(() => {
                        alert('Un email a été envoyé au client pour définir son mot de passe.');
                        document.getElementById('create-account-form').reset();
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'envoi de l\'email de réinitialisation : ', error);
                    });
            }).catch(error => {
                console.error('Erreur lors de la création du compte : ', error);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la création de l\'utilisateur : ', error);
        });
});

function getPhotoCredits(subscriptionType) {
    switch (subscriptionType) {
        case 'démarrage':
            return 60;
        case 'standard':
            return 120;
        case 'premium':
            return 180;
        case 'entreprise':
            return 300;
        default:
            return 0;
    }
}
