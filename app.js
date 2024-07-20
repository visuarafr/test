// Import the functions you need from the SDKs you need
import { auth, db, storage } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDoc, doc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

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
                    if (window.location.pathname.endsWith('/index.html') || window.location.pathname === '/') {
                        window.location.replace('selection.html');
                    }
                } else {
                    console.log("No such document!");
                    alert('No user data found. Please contact support.');
                }
            } catch (error) {
                console.error("Error getting document:", error);
            }
        } else {
            console.log('No user is signed in', window.location.pathname);
            // Redirection conditionnelle uniquement si sur les pages protégées
            if (window.location.pathname.endsWith('/dashboard.html') || window.location.pathname.endsWith('/selection.html') || window.location.pathname.endsWith('/retrieve.html')) {
                window.location.replace('index.html');
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
            window.location.replace('selection.html');
        })
        .catch(error => {
            console.error("Login error:", error);
            alert(error.message);
        });
}

// Logout function
window.logout = function() {
    console.log("Logout function called");
    signOut(auth)
        .then(() => {
            console.log("User logged out");
            window.location.replace('index.html');
        })
        .catch(error => {
            console.error("Logout error:", error);
            alert(error.message);
        });
}

// Function to get user's shootings
async function getUserShootings(user) {
    const photosContainer = document.getElementById('photos-container');
    if (!photosContainer) return;
    photosContainer.innerHTML = '';

    const q = query(collection(db, "requests"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const photoDiv = document.createElement('div');
        photoDiv.classList.add('photo-entry');
        photoDiv.innerHTML = `
            <h3>Type: ${data.shootingType}</h3>
            <p>Date: ${data.date}</p>
            <p>Address: ${data.address}</p>
            <p>City: ${data.city}</p>
            <p>Additional Info: ${data.additionalInfo}</p>
            <button onclick="viewShooting('${doc.id}')">View Photos/Videos</button>
        `;
        photosContainer.appendChild(photoDiv);
    });
}

// Function to view a specific shooting
window.viewShooting = async function(shootingId) {
    const user = auth.currentUser;
    if (!user) return;

    const storageRef = ref(storage, `shootings/${user.uid}/${shootingId}`);
    const listRef = await listAll(storageRef);

    const photosContainer = document.getElementById('photos-container');
    if (!photosContainer) return;
    photosContainer.innerHTML = '';

    listRef.items.forEach(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const mediaElement = document.createElement('div');
        mediaElement.classList.add('media');

        if (itemRef.name.endsWith('.jpg') || itemRef.name.endsWith('.png')) {
            mediaElement.innerHTML = `<img src="${url}" alt="${itemRef.name}">`;
        } else if (itemRef.name.endsWith('.mp4')) {
            mediaElement.innerHTML = `<video controls src="${url}"></video>`;
        }

        photosContainer.appendChild(mediaElement);
    });
}

// Check if user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User authenticated, loading shootings");
        getUserShootings(user);
    } else {
        if (window.location.pathname.endsWith('/retrieve.html')) {
            window.location.replace('index.html');
        }
    }
});

// Function to handle request submission
window.submitRequest = async function(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        window.location.replace('index.html');
        return;
    }

    const shootingType = document.getElementById('shootingType').value;
    const specificShooting = document.getElementById('specificShooting').value;
    const date = document.getElementById('date').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const additionalInfo = document.getElementById('additionalInfo').value;

    const docRef = doc(db, "clients", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const clientData = docSnap.data();
        let creditsRemaining = clientData.photoCredits;
        let shootingsRemaining = clientData.shootingsRemaining || 0;

        let creditsUsed = 0;
        switch (specificShooting) {
            case 'Signature':
            case 'Signature+':
                creditsUsed = 12;
                break;
            case 'Héritage':
            case 'Héritage+':
                creditsUsed = 20;
                break;
            case 'Excellence':
            case 'Excellence+':
                creditsUsed = 30;
                break;
            case 'Prestige':
            case 'Prestige+':
                creditsUsed = 40;
                break;
        }

        if (creditsRemaining >= creditsUsed && (shootingsRemaining > 0 || clientData.subscriptionType === 'premium' || clientData.subscriptionType === 'entreprise')) {
            await addDoc(collection(db, 'requests'), {
                shootingType,
                specificShooting,
                date,
                address,
                city,
                additionalInfo,
                userId: user.uid,
                createdAt: serverTimestamp()
            });

            creditsRemaining -= creditsUsed;
            if (clientData.subscriptionType === 'demarrage' || clientData.subscriptionType === 'standard') {
                shootingsRemaining--;
            }

            await updateDoc(docRef, {
                photoCredits: creditsRemaining,
                shootingsRemaining: shootingsRemaining
            });

            document.getElementById('credits-count').innerText = creditsRemaining;

            alert('Request submitted!');
            sendToTrello({ shootingType, specificShooting, date, address, city, additionalInfo });
        } else {
            alert('Not enough photo credits or shootings remaining');
        }
    } else {
        console.log("No such document!");
    }
};

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

// Reset credits and shootings on the 1st of the month
async function resetCreditsAndShootings() {
    const clientsRef = collection(db, 'clients');
    const querySnapshot = await getDocs(clientsRef);

    querySnapshot.forEach(async (clientDoc) => {
        const clientData = clientDoc.data();
        let newCredits = 0;
        let newShootings = 0;

        switch (clientData.subscriptionType) {
            case 'demarrage':
                newCredits = 60;
                newShootings = 3;
                break;
            case 'standard':
                newCredits = 100;
                newShootings = 5;
                break;
            case 'premium':
                newCredits = 180;
                newShootings = 'unlimited'; // Shooting illimité
                break;
            case 'entreprise':
                newCredits = 300;
                newShootings = 'unlimited'; // Shooting illimité
                break;
        }

        await updateDoc(clientDoc.ref, {
            photoCredits: newCredits,
            shootingsRemaining: newShootings !== 'unlimited' ? newShootings : clientData.shootingsRemaining,
        });
    });
}

function checkFirstOfMonth() {
    const today = new Date();
    if (today.getDate() === 1) {
        resetCreditsAndShootings().then(() => {
            console.log("Credits and shootings have been reset for the month.");
        }).catch((error) => {
            console.error("Error resetting credits and shootings:", error);
        });
    }
}

// Check and reset credits and shootings on page load
document.addEventListener('DOMContentLoaded', checkFirstOfMonth);

