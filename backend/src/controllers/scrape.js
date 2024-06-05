import axios from "axios";
import {JSDOM} from "jsdom";

function extractStarCount(starElement){
    //Iterate through each class until we find the class which mentions the star count.
    //Then, use a regex to match and extract the numerical value of stars from the class name.
    for (const cl of starElement.classList){
        const match = cl.match(/^a-star-small-([0-4]-[0-5]|[0-5])$/);
        if (match){
            return match[1].replace('-', '.');
        }
    }
    console.error('Error when extracting stars.');
    return '-1';
}

function decomposeItem(item){
    //Find the title based on the data-cy attribute and then get the descendant with the actual text.
    const title = item.querySelector('div[data-cy="title-recipe"] a span').innerHTML;

    //Find the star element based on a unique class named a-icon-star-small and then get the extract the actual
    // numerical count. Some products have no reviews, so return null.
    const starEl = item.querySelector('.a-icon-star-small');
    const stars = starEl ? extractStarCount(starEl) : null;

    //Find the review count element based on the data-csa-c-content-id attribute
    // then get the descendant with the actual text. Some products have no reviews, so return 0.
    const reviewCount =
        item.querySelector('div[data-csa-c-content-id="alf-customer-ratings-count-component"] a span')?.innerHTML
        ?? 0;

    //Find and join the two price elements, considering items with no available price.
    const priceWhole = item.querySelector('.a-price-whole')?.innerHTML;
    const priceFraction = item.querySelector('.a-price-fraction')?.innerHTML;
    const price = (priceWhole && priceFraction) ? `${priceWhole}${priceFraction}` : null;

    //Find the image element based on the data-component-type attribute and get its source.
    const imageUrl = item.querySelector('[data-component-type="s-product-image"] img').src;

    //Find the title url and get its href.
    const href = item.querySelector('div[data-cy="title-recipe"] a').href;
    const productUrl = 'https://www.amazon.com/' + href;

    return { title, stars, reviewCount, price, imageUrl, productUrl };
}

export async function getProducts(req, res){
    //Extract and verify keyword from query.
    const keyword = req.query.keyword?.replace(' ', '+');
    if (!keyword){
        return res.status(400).send({error: 'Missing keyword.'});
    }

    try{
        //Fetch with axios and create the dom with JSDOM.
        const response = await axios.get(`https://www.amazon.com/s?k=${keyword}`);
        const dom = new JSDOM(response.data);

        //Scrape the actual html document by querying all elements with the [data-component-type=s-search-result].
        const document = dom.window.document;
        const results = document
            .querySelectorAll('[data-component-type="s-search-result"]');

        //Parse and return the result.
        const parsedResults = Array.from(results).map(decomposeItem);
        return res.status(200).json(parsedResults);
    } catch (err) {
        if (err.status === 503){
            console.log({error: 'Missing keyword.'});
            return res.status(503).send('You reached the limit of amazon fetch requests.');
        }

        console.error(`Unhandled error when fetching amazon search for [${keyword}]`, err);
        return res.status(500).send({error: 'Missing keyword.'});
    }
}