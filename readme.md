# Scraping API

All In One solution to **scrape webpage in Node.js** without headaches.

**/!\ Currently in development**

✅ Fully automated proxy rotation with HQ residential IPs. No captcha, and you will never be detected as a bot or proxy user
✅ Integrated data extraction with CSS / jQuery selectors, filters, conditions and iterators
✅ Smart data filters: URL, prices, title + custom filters on request
✅ Up to 3 requests per call
✅ Allowed to send json or form-encoded body & cookies
✅ Returns response body, headers, final URL & status code
✅ Supports redirects 
✅ Presets for popular websites: Coming soon

## Get started: 5 minutes chrono

1. **Install** the package from NPM
    `npm install --save scrapingapi`
2. Get your **API key**
    Simply by [creating an account](https://rapidapi.com/auth/sign-up) on RapidAPI
3. **Enjoy** scraping without headaches !

💡 **TIP**: You can test your requests with [Insomnia](https://github.com/Kong/insomnia) (Open Source + Cross Platform)

## Simple Usage Example

```typescript
const Scraper = require("scrapingapi")(API_KEY);

scraper.get("https://www.google.com/search?q=bitcoin", {
    // Extract the current bitcoin price                  
    price: ["#search .obcontainer .card-section > div:eq(1)", "text", true, "price"],
    // Search results
    results: {
        // For each Google search result
        $foreach: "h2:contains('Web results') + div",
        // We retrieve the URL
        url: ["a[href]", "href", true, "url"],
        // ... And the title
        title: ["h3", "text", true, "title"]
    }
}, { device: "desktop" }).then( data => {

    console.log("Here are the results:", data );

});
```

### You will get the following result

```json
[{
    "url": "https://www.google.com/search?q=bitcoin",
    "status": 200,
    "data": {
        "price": {
            "amount": 50655.51,
            "currency": "EUR"
        },
        "results": [{
            "url": "https://bitcoin.org/",
            "title": "Bitcoin - Open source P2P money"
        }, {
            "url": "https://coinmarketcap.com/currencies/bitcoin/",
            "title": "Bitcoin price today, BTC to USD live, marketcap and chart"
        }, {
            "url": "https://www.bitcoin.com/",
            "title": "Bitcoin.com | Buy BTC, ETH & BCH | Wallet, news, markets ..."
        }, {
            "url": "https://en.wikipedia.org/wiki/Bitcoin",
            "title": "Bitcoin - Wikipedia"
        }]
    }
}]
```

## Documentation

### Requests

TODO

### Items extraction

TODO

### Value extraction

TODO

### Responses

TODO