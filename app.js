// Function to submit request
function submitRequest(e) {
    e.preventDefault();

    const shootingType = document.getElementById('shootingType').value;
    const specificShooting = document.getElementById('specificShooting').value;
    const date = document.getElementById('date').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const additionalInfo = document.getElementById('additionalInfo').value;

    addDoc(collection(db, 'requests'), {
        shootingType,
        specificShooting,
        date,
        address,
        city,
        additionalInfo,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
    }).then(() => {
        alert('Request submitted!');
        sendToTrello({ shootingType, specificShooting, date, address, city, additionalInfo });
    }).catch(error => {
        console.error('Error adding document: ', error);
    });
}
