import Scraper, { $, TExtractedPrice } from '../src';
const page = new Scraper('996ef6c0-e1ae-4ec1-85bd-b0dde74c9431');

type TReview = {
    author: string,
    title: string
}

type TAmazonResults = {
    title: string,
    price: TExtractedPrice,
    image: string,
    reviews: {
        rating?: string,
        list: TReview[]
    }
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