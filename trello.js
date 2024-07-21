export async function sendToTrello(request, companyName) {
    console.log('Sending request to Trello:', request);

    const trelloKey = 'be54e3f7ff2c69550f1ac28b202b7458';
    const trelloToken = 'ATTAc64ad16d6a5dfa2af0d106b42cb1c9ffad6f80ac4c1e3fce4bb03801473eff247EDCE65C';
    const listId = '6650d37d314c2a17bbcf7090';

    const title = `Shooting ${companyName} ${request.date}`;
    const description = `
<b>Type de Shooting:</b> ${request.shootingType}<br>
<b>Shooting Spécifique:</b> ${request.specificShooting}<br>
<b>Date:</b> ${request.date}<br>
<b>Adresse:</b> ${request.address}<br>
<b>Ville:</b> ${request.city}<br>
<b>Informations supplémentaires:</b> ${request.additionalInfo}<br>
    `;

    const url = `https://api.trello.com/1/cards?key=${trelloKey}&token=${trelloToken}&idList=${listId}&name=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`;

    console.log('Trello request URL:', url);
    
    try {
        const response = await fetch(url, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error(`Error sending to Trello: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Trello card created:', data);
    } catch (error) {
        console.error('Error creating Trello card:', error);
        throw error;
    }
}