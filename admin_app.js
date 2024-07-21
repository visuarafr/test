// admin_app.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { setDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Function to check if the user has admin privileges
async function checkAdminPermissions(user) {
    const docRef = doc(db, "admins", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return true;
    } else {
        // Ajout de l'utilisateur en tant qu'admin s'il n'existe pas déjà
        if (user.email === "yannmartial@visuara.fr") {
            await setDoc(docRef, { email: user.email });
            return true;
        }
        return false;
    }
}

// Admin Login function
window.adminLogin = function() {
    console.log("Admin login function called");
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(async userCredential => {
            const user = userCredential.user;
            if (await checkAdminPermissions(user)) {
                console.log("Admin logged in");
                window.location.replace('admin_selection.html');
            } else {
                console.error("You do not have admin permissions.");
                alert("You do not have admin permissions.");
                signOut(auth);
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
    const clientType = document.getElementById('client-type').value;
    let photoCredits = 0;
    let videoCredits = "";

    switch (clientType) {
        case 'prestations':
            photoCredits = 0; // Pas de crédits photo fixes pour les prestations
            break;
        case 'prestations_plus':
            videoCredits = "1 vidéo par shooting"; // Vidéo par shooting pour prestations plus
            break;
        case 'abonnements':
            const subscriptionType = document.getElementById('signup-subscription').value;
            if (subscriptionType === 'demarrage') photoCredits = 60;
            if (subscriptionType === 'standard') photoCredits = 100;
            if (subscriptionType === 'premium') photoCredits = 180;
            if (subscriptionType === 'entreprise') photoCredits = 300;
            break;
        case 'abonnements_plus':
            const subscriptionPlusType = document.getElementById('signup-subscription').value;
            if (subscriptionPlusType === 'demarrage') {
                photoCredits = 60;
                videoCredits = "1 vidéo de 45 sec par shooting";
            }
            if (subscriptionPlusType === 'standard') {
                photoCredits = 100;
                videoCredits = "1 vidéo de 1 min par shooting";
            }
            if (subscriptionPlusType === 'premium') {
                photoCredits = 180;
                videoCredits = "1 vidéo de 1 min 30 sec par shooting";
            }
            if (subscriptionPlusType === 'entreprise') {
                photoCredits = 300;
                videoCredits = "1 vidéo de 2 min par shooting";
            }
            break;
    }

    const clientData = {
        clientType: clientType,
        companyName: document.getElementById('signup-company').value,
        email: email,
        photoCredits: photoCredits,
        videoCredits: videoCredits,
        subscriptionType: clientType.includes("abonnements") ? document.getElementById('signup-subscription').value : ""
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

            // Envoyer un email de réinitialisation de mot de passe
            await sendPasswordResetEmail(auth, email);
            console.log("Password reset email sent");

            alert('User account created successfully. A password reset email has been sent to the user.');
        } else {
            alert('You do not have admin permissions.');
        }
    } catch (error) {
        console.error("Error creating new user:", error);
        alert('Error creating new user: ' + error.message);
    }
}

// Logout function
window.logout = function() {
    signOut(auth)
        .then(() => {
            window.location.replace('admin_login.html');
        })
        .catch((error) => {
            console.error("Logout error:", error);
            alert(error.message);
        });
}

// Redirect to selection page if admin is already logged in
document.addEventListener('DOMContentLoaded', (event) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const docRef = doc(db, "admins", user.uid);
            const docSnap = await getDoc(docRef);

            const currentPath = window.location.pathname;
            const isAdminSelection = currentPath.includes('admin_selection.html');
            const isAssignShooting = currentPath.includes('admin_assign_shooting.html');
            const isCreateAccount = currentPath.includes('create_account.html');

            if (docSnap.exists() && !isAdminSelection && !isAssignShooting && !isCreateAccount) {
                window.location.replace('admin_selection.html');
            } else if (!docSnap.exists()) {
                signOut(auth);
            }
        }
    });
});
