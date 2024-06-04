//Ideally, the port and backend url would be configured in a .env file.
//Due to the simplicity of the scope, I consider it alright to keep it hardcoded.
const backendPort = 8080;

//Query the relevant elements from the document.
const inputElement = document.querySelector('#keyword-input');
const resultContainer = document.querySelector('#result-container');
//The result item is kept in the html as a blueprint for being cloned for each result.
//Once we have it stored, we can remove the generic blueprint from the page.
const resultItemPrefab =  document.querySelector('.result-item');
resultItemPrefab.remove();

/**
 * @param item An object in the format:
 * { title, stars, reviewCount, imageUrl }
 * @returns {Node} A html node representing the item.
 */
function generateItemElement(item){
    const element = resultItemPrefab.cloneNode(true);
    element.querySelector('.result-title').innerHTML = item.title;
    element.querySelector('.result-img').src = item.imageUrl;
    element.querySelector('.result-reviews').innerHTML = `${item.stars}/5 (${item.reviewCount} reviews)`;
    return element;
}

function onSubmitSearch(){
    const keyword = inputElement.value;
    const scrapeUrl = `http://localhost:${backendPort}/api/scrape/?keyword=${keyword}`;
    fetch(scrapeUrl).then(async res => {
        const json = await res.json();
        const resultElements = json.map(item => generateItemElement(item));
        resultContainer.replaceChildren(...resultElements);
    }).catch(err => {
        if (err.status === 503){
            resultContainer.innerHTML = 'You ran out of available fetches. Please try again later!';
            return;
        }
        console.error('Unhandled error when fetching.', err);
    });
}