import Scraper, { $, TExtractedPrice } from '../src';
const page = new Scraper('f47c66b8-35cb-43d2-bd9c-67a5ade5d51f');

type TAmazonResults = {
    
}

// Scrape Amazon search results for "bitcoin"
page.get<TAmazonResults>("https://www.amazon.com/dp/B08L76BSZ5", { device: 'mobile', withHeaders: true }, {

    title: $("#title"),
    price: $("#corePrice_feature_div .a-offscreen:first").filter("price"),
    image: $("#main-image").attr("src").filter("url"),

    reviews: {
        rating: $(".cr-widget-Acr [data-hook='average-stars-rating-text']").optional(),
        list: $("#cm-cr-dp-aw-review-list > [data-hook='mobley-review-content']").each({
            author: $(".a-profile-name"),
            title: $("[data-hook='review-title']")
        })
    }

}).then( data => {

    console.dir(data, { depth: null });

});