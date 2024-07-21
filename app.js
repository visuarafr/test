import { auth, db, storage } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDoc, doc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { ref, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";
import { sendToTrello } from './trello.js';

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
                    if (document.getElementById('shootings-count')) {
                        document.getElementById('shootings-count').innerText = clientData.shootingsRemaining === 'unlimited' ? 'illimité' : clientData.shootingsRemaining;
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

window.submitRequest = async function(event) {
    event.preventDefault();
    
    const shootingType = document.getElementById('shootingType').value;
    const specificShooting = document.getElementById('specificShooting').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value; // Récupérer l'heure
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const additionalInfo = document.getElementById('additionalInfo').value;

    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "clients", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const clientData = docSnap.data();
        let creditsRequired = 0;
        let shootingsRequired = 1;
        let minDays = 3;

        switch (clientData.subscriptionType) {
            case 'Démarrage':
            case 'Standard':
                minDays = 3;
                break;
            case 'Premium':
            case 'Entreprise':
                minDays = 2;
                break;
            // Ajoutez d'autres cas si nécessaire
        }

        // Validation des dates
        const selectedDate = new Date(date);
        const today = new Date();
        const maxDate = new Date(today);
        maxDate.setMonth(today.getMonth() + 1);

        // Reset hours for date comparison
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        minDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert("Vous ne pouvez pas réserver une date dans le passé.");
            return;
        }

        if (selectedDate > maxDate) {
            alert("Vous ne pouvez pas réserver une date plus de 1 mois à l'avance.");
            return;
        }

        const minDate = new Date(today);
        minDate.setDate(today.getDate() + minDays);

        if (selectedDate < minDate) {
            alert(`Vous devez réserver au moins ${minDays} jours à l'avance.`);
            return;
        }

        switch (specificShooting) {
            case 'Signature':
                creditsRequired = 12;
                break;
            case 'Héritage':
                creditsRequired = 20;
                break;
            case 'Excellence':
                creditsRequired = 30;
                break;
            case 'Prestige':
                creditsRequired = 40;
                break;
            case 'Signature+':
                creditsRequired = 12;
                break;
            case 'Héritage+':
                creditsRequired = 20;
                break;
            case 'Excellence+':
                creditsRequired = 30;
                break;
            case 'Prestige+':
                creditsRequired = 40;
                break;
            // Ajoutez d'autres cas si nécessaire
        }

        if (clientData.photoCredits >= creditsRequired && (clientData.shootingsRemaining === 'unlimited' || clientData.shootingsRemaining >= shootingsRequired)) {
            await addDoc(collection(db, 'requests'), {
                shootingType,
                specificShooting,
                date,
                time, // Inclure l'heure
                address,
                city,
                additionalInfo,
                userId: user.uid,
                createdAt: serverTimestamp()
            });

            await updateDoc(docRef, {
                photoCredits: clientData.photoCredits - creditsRequired,
                shootingsRemaining: clientData.shootingsRemaining === 'unlimited' ? 'unlimited' : clientData.shootingsRemaining - shootingsRequired
            });

            // Envoyer les informations de demande à Trello
            const request = {
                shootingType,
                specificShooting,
                date,
                time, // Inclure l'heure
                address,
                city,
                additionalInfo
            };
            try {
                console.log('Sending request to Trello with data:', request);
                await sendToTrello(request, clientData.companyName);
                alert('Request submitted successfully and added to Trello!');
            } catch (error) {
                console.error('Error sending to Trello:', error);
                alert('Request submitted but failed to add to Trello.');
            }

            // Mettre à jour les crédits et shootings affichés
            if (document.getElementById('credits-count')) {
                document.getElementById('credits-count').innerText = clientData.photoCredits - creditsRequired;
            }
            if (document.getElementById('shootings-count')) {
                document.getElementById('shootings-count').innerText = clientData.shootingsRemaining === 'unlimited' ? 'illimité' : clientData.shootingsRemaining - shootingsRequired;
            }
        } else {
            alert('Not enough credits or shootings remaining.');
        }
    }
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
