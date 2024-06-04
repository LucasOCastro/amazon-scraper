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
    //Find the title based on a unique class named s-title-instructions-style
    // and then get the descendant with the actual text.
    const title = item
        .querySelector('.s-title-instructions-style')
        .querySelector('span .a-text-normal')
        .firstChild.innerHTML;

    //Find the star element based on a unique class named a-icon-star-small
    // and then get the extract the actual numerical count.
    const starEl = item.querySelector('.a-icon-star-small');
    const stars = extractStarCount(starEl);

    //Climb up the tree from the star element then get the sibling,
    // as the review count is right after the star indicator.
    // Then get the descendant with the actual text.
    const reviewCount = starEl
        .parentElement
        .parentElement
        .parentElement
        .nextElementSibling
        .querySelector('span .s-underline-text')
        .firstChild.innerHTML;

    //Find the image element based on a unique class named s-image and get its source.
    const imageUrl = item.querySelector('.s-image').src;

    return { title, stars, reviewCount, imageUrl };
}

export async function getProducts(req, res){
    //Extract and verify keyword from query.
    const keyword = req.query.keyword;
    if (!keyword){
        return res.status(400).send('Missing keyword.');
    }

    try{
        //Fetch with axios and create the dom with JSDOM.
        const response = await axios.get(`https://www.amazon.com/s?k=${keyword}`);
        const dom = new JSDOM(response.data);

        //Scrape the actual html document by parsing all elements with the type attribute
        // indicating a search result.
        const document = dom.window.document;
        const results = document
            .querySelectorAll('[data-component-type="s-search-result"]');

        //Parse and return the result.
        const parsedResults = Array.from(results).map(decomposeItem);
        return res.status(200).json(parsedResults);
    } catch (err) {
        if (err.status === 503){
            console.log('No more requests available.');
            return res.status(503).send('You reached the limit of amazon fetch requests.');
        }

        console.error('Unhandled error when fetching amazon search.', err);
        return res.status(500).send('Server error.');
    }
}