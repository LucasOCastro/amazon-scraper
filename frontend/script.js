//Ideally, the port and backend url would be configured in a .env file.
//Due to the simplicity of the scope, I consider it alright to keep it hardcoded.
const backendPort = 8080;

//Query the relevant elements from the document.
const inputElement = document.querySelector('#keyword-input');
const searchButton = document.querySelector('#search-button');
const resultContainer = document.querySelector('#result-container');

//The result item is kept in the html as a blueprint for being cloned for each result.
//Once we have it stored, we can remove the generic blueprint from the page.
const resultItemPrefab =  document.querySelector('.result-item');
resultItemPrefab.remove();

//Register event to trigger the scraping process when the user presses the Enter key.
inputElement.addEventListener('keypress', event => {
    if (event.key === 'Enter'){
        onSubmitSearch();
    }
})

/**
 * @param item An object in the format:
 * { title, stars, reviewCount, imageUrl }
 * @returns {Node} A html node representing the item.
 */
function generateItemElement(item){
    const element = resultItemPrefab.cloneNode(true);
    element.onclick = () => window.location = item.productUrl;
    element.querySelector('.result-title').innerHTML = item.title;
    element.querySelector('.result-img').src = item.imageUrl;
    element.querySelector('.result-reviews').innerHTML = item.reviewCount > 0
        ? `${item.stars}/5 (${item.reviewCount} user reviews)`
        : '(no user reviews)';
    element.querySelector('.result-price').innerHTML = item.price
        ? `$${item.price}`
        : 'No available price.';
    return element;
}

function onSubmitSearch(){
    resultContainer.innerHTML = 'Loading...';
    inputElement.disabled = true;
    searchButton.disabled = true;

    const keyword = inputElement.value;
    const scrapeUrl = `http://localhost:${backendPort}/api/scrape/?keyword=${keyword}`;
    fetch(scrapeUrl).then(async res => {
        if (!res.ok){
            throw {status: res.status};
        }
        const json = await res.json();
        const resultElements = json.map(item => generateItemElement(item));
        //Replace children after slight interval to make sure the nodes updated.
        requestAnimationFrame(() => resultContainer.replaceChildren(...resultElements));
    }).catch(err => {
        switch (err.status){
            case 503:
                resultContainer.innerHTML = 'You ran out of available fetches. Please try again later!';
                break;
            case 400:
                resultContainer.innerHTML = 'Invalid keyword.';
                break;
            default:
                console.error('Unhandled error when fetching.', err);
                resultContainer.innerHTML = 'Server error when fetching amazon data. Sorry!';
                break;
        }
    }).finally(() => {
        inputElement.disabled = false;
        searchButton.disabled = false;
    });
}