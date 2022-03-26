import Scraper, { $, TExtractedPrice } from '../src';
const page = new Scraper('API_KEY');

type TGoogleResults = {
    price: TExtractedPrice,
    results: {
        url: string,
        title: string
    }[]
}

// Scrape Google search results for "bitcoin"
page.get<TGoogleResults>("https://www.google.com/search?q=bitcoin", { device: "desktop" }, {
    // Extract the current bitcoin price                  
    price: $("#search .obcontainer .card-section > div:eq(1)").filter("price"),
    // For each Google search result
    results: $("h2:contains('Web results') + div").each({
        // We retrieve the URL
        url: $("a[href]").attr("href").filter("url"),
        // ... And the title text
        title: $("h3")
    })
}).then( data => {

    console.log("Here are the results:", data);

});