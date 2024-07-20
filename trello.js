// trello.js
const trelloKey = 'be54e3f7ff2c69550f1ac28b202b7458';
const trelloToken = 'ATTAc64ad16d6a5dfa2af0d106b42cb1c9ffad6f80ac4c1e3fce4bb03801473eff247EDCE65C';
const listId = '6650d37d314c2a17bbcf7090';

export async function sendToTrello(request) {
    const response = await fetch(`https://api.trello.com/1/cards?key=${trelloKey}&token=${trelloToken}&idList=${listId}&name=${encodeURIComponent('New Request')}&desc=${encodeURIComponent(`Type: ${request.shootingType}\nDate: ${request.date}\nAddress: ${request.address}\nCity: ${request.city}\nAdditional Info: ${request.additionalInfo}`)}`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error('Failed to create Trello card');
    }

    return response.json();
}
