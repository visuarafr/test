import { auth, db, storage } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOMContentLoaded event fired");
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is signed in', user);
            loadShootings(user);
        } else {
            console.log('No user is signed in');
            window.location.replace('index.html');
        }
    });
});

async function loadShootings(user) {
    const photosContainer = document.getElementById('photos-container');
    photosContainer.innerHTML = '';

    const q = query(collection(db, "requests"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        photosContainer.innerHTML = '<p class="no-shootings text-center w-100">No shootings found. Please check back later.</p>';
    } else {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const folderDiv = document.createElement('div');
            folderDiv.classList.add('list-group-item', 'folder');
            folderDiv.setAttribute('onclick', `viewShooting('${user.uid}', '${doc.id}')`);
            folderDiv.innerHTML = `
                <i class="fas fa-folder folder-icon"></i>
                <div class="folder-title">${data.date} - ${data.shootingType}</div>
            `;
            photosContainer.appendChild(folderDiv);
        });
    }
}

window.viewShooting = async function(userId, shootingId) {
    const photosContainer = document.getElementById('photos-container');
    photosContainer.innerHTML = '';

    document.getElementById('breadcrumb-folder').classList.remove('d-none');
    document.querySelector('.breadcrumb-item.active').classList.remove('active');
    document.getElementById('breadcrumb-folder').classList.add('active');

    const storageRef = ref(storage, `shootings/${userId}/${shootingId}`);
    const listRef = await listAll(storageRef);

    if (listRef.items.length === 0) {
        photosContainer.innerHTML = '<p class="no-shootings text-center w-100">No files found in this shooting.</p>';
    } else {
        listRef.items.forEach(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const mediaElement = document.createElement('div');
            mediaElement.classList.add('media', 'mb-4');

            if (itemRef.name.endsWith('.jpg') || itemRef.name.endsWith('.png')) {
                mediaElement.innerHTML = `<img src="${url}" alt="${itemRef.name}" class="img-fluid">`;
            } else if (itemRef.name.endsWith('.mp4')) {
                mediaElement.innerHTML = `<video controls src="${url}" class="img-fluid"></video>`;
            }

            photosContainer.appendChild(mediaElement);
        });
    }
}

window.logout = function() {
    signOut(auth).then(() => {
        window.location.replace('index.html');
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
}
