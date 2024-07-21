import { auth, db, storage } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDoc, doc, collection, query, where, getDocs, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";
import { sendToTrello } from './trello.js';

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOMContentLoaded event fired");
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User is signed in', user.uid, window.location.pathname);
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
                    if (document.getElementById('shootings-count')) {
                        document.getElementById('shootings-count').innerText = clientData.shootingsRemaining === 'unlimited' ? 'illimité' : clientData.shootingsRemaining;
                    }

                    if (window.location.pathname.endsWith('/index.html') || window.location.pathname === '/') {
                        window.location.replace('selection.html');
                    }
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error getting document:", error);
            }
        } else {
            console.log('User is signed out');
        }
    });
});

window.login = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed in:', user.uid);
            window.location.replace('dashboard.html'); // Redirect to the dashboard or another page
        })
        .catch((error) => {
            console.error('Error signing in:', error);
            alert('Error signing in: ' + error.message);
        });
};

window.searchCompany = async function() {
    const companyName = document.getElementById('search-company').value;
    console.log('Searching for company:', companyName);
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
    console.log('Search completed, results updated');
};

window.selectClient = function(clientId) {
    selectedClientId = clientId;
    document.getElementById('assign-shooting-form').style.display = 'block';
    console.log('Selected client:', clientId);
};

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

    console.log('Assigning shooting:', {
        selectedClientId,
        shootingDate,
        shootingType,
        shootingAddress,
        shootingCity,
        shootingAdditionalInfo,
        shootingPhotosCount: shootingPhotos.length
    });

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
        console.log('New shooting request created with ID:', shootingId);

        for (let i = 0; i < shootingPhotos.length; i++) {
            const photo = shootingPhotos[i];
            const storageRef = ref(storage, `shootings/${selectedClientId}/${shootingId}/${photo.name}`);
            await uploadBytes(storageRef, photo);
            console.log('Uploaded photo:', photo.name);
        }

        const trelloRequest = {
            shootingType,
            date: shootingDate,
            address: shootingAddress,
            city: shootingCity,
            additionalInfo: shootingAdditionalInfo
        };
        await sendToTrello(trelloRequest);
        console.log('Shooting details sent to Trello');

        alert('Shooting assigned successfully.');
    } catch (error) {
        console.error("Error assigning shooting:", error);
        alert('Error assigning shooting: ' + error.message);
    }
};

window.logout = function() {
    signOut(auth).then(() => {
        window.location.replace('index.html');
        console.log('User signed out successfully');
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
};

// Function to reset credits and shootings at the beginning of each month
async function resetMonthlyCredits() {
    const usersQuery = query(collection(db, "clients"));
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.forEach(async (userDoc) => {
        const userData = userDoc.data();
        let newPhotoCredits = 0;
        let newShootingsRemaining = 'unlimited';

        switch (userData.subscriptionType) {
            case 'Démarrage':
                newPhotoCredits = 60;
                newShootingsRemaining = 1;
                break;
            case 'Standard':
                newPhotoCredits = 100;
                newShootingsRemaining = 2;
                break;
            case 'Premium':
                newPhotoCredits = 180;
                break;
            case 'Entreprise':
                newPhotoCredits = 300;
                break;
            // Ajoutez d'autres cas si nécessaire
        }

        await updateDoc(doc(db, "clients", userDoc.id), {
            photoCredits: newPhotoCredits,
            shootingsRemaining: newShootingsRemaining
        });
    });
}

// Vérifiez si c'est le début du mois pour réinitialiser les crédits et les shootings
const now = new Date();
if (now.getDate() === 1) {
    resetMonthlyCredits();
}
