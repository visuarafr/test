// app.js
import { auth, db, storage } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDoc, doc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
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
