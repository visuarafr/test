// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, query, collection, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

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
const storage = getStorage(app);

let selectedClientId = null;

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOMContentLoaded event fired");
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is signed in', user);
            // Check if user is an admin
            checkAdminPermissions(user).then(isAdmin => {
                if (!isAdmin) {
                    alert('You do not have admin permissions.');
                    window.location.replace('index.html');
                }
            });
        } else {
            console.log('No user is signed in');
            window.location.replace('index.html');
        }
    });
});

async function checkAdminPermissions(user) {
    const docRef = doc(db, "admins", user.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

window.searchCompany = async function() {
    const companyName = document.getElementById('search-company').value;
    const q = query(collection(db, "clients"), where("companyName", "==", companyName));
    const querySnapshot = await getDocs(q);
    
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const clientData = doc.data();
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('result-entry');
        resultDiv.innerHTML = `
            <p>Company Name: ${clientData.companyName}</p>
            <p>Email: ${clientData.email}</p>
            <button onclick="selectClient('${doc.id}')">Select</button>
        `;
        searchResults.appendChild(resultDiv);
    });
}

window.selectClient = function(clientId) {
    selectedClientId = clientId;
    document.getElementById('assign-shooting-form').style.display = 'block';
}

window.assignShooting = async function() {
    if (!selectedClientId) {
        alert('Please select a client first.');
        return;
    }

    const shootingDate = document.getElementById('shooting-date').value;
    const shootingType = document.getElementById('shooting-type').value;
    const shootingAddress = document.getElementById('shooting-address').value;
    const shootingCity = document.getElementById('shooting-city').value;
    const shootingAdditionalInfo = document.getElementById('shooting-additional-info').value;
    const shootingPhotos = document.getElementById('shooting-photos').files;

    try {
        const newShootingRef = await addDoc(collection(db, "requests"), {
            userId: selectedClientId,
            date: shootingDate,
            shootingType: shootingType,
            address: shootingAddress,
            city: shootingCity,
            additionalInfo: shootingAdditionalInfo,
            createdAt: new Date()
        });

        const shootingId = newShootingRef.id;

        // Upload photos
        for (let i = 0; i < shootingPhotos.length; i++) {
            const photo = shootingPhotos[i];
            const storageRef = ref(storage, `shootings/${selectedClientId}/${shootingId}/${photo.name}`);
            await uploadBytes(storageRef, photo);
        }

        alert('Shooting assigned successfully.');
    } catch (error) {
        console.error("Error assigning shooting:", error);
        alert('Error assigning shooting: ' + error.message);
    }
}

window.logout = function() {
    signOut(auth).then(() => {
        window.location.replace('index.html');
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
}
