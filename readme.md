# Dopamyn Scraper

Simple & Human-Friendly HTML Scraper with Proxy Rotator.

[![npm](https://img.shields.io/npm/v/declarative-scraper)](https://www.npmjs.com/package/declarative-scraper)

**/!\ WARNING: This package is not enough mature to be used in production.**

## Installation

```bash
npm install --save declarative-scraper
```

## Usage Example

```typescript
// Import dependencies
import Scraper, { gotAdapter, Action } from 'declarative-scraper';
import got from 'got';

// Configure your scraper
const scraper = new Scraper({

    // Use the got package to make our http requests
    adapter: gotAdapter(got),
    // Show debug infos 
    debug: true,
    // If an error occurs while extracting item infos, we stop scraping by throwing an error
    onItemError: Action.EXCLUDE,

});

// Scrape Cryptocurrencies list
const results = await scraper.scrape({

    // 1. Basic options
    id: 'cryptocurrencies', // Identifier for debugging
    url: 'https://coinmarketcap.com/', // URL address to scrape

    // 2. Extraction
    items: $ => $('table.cmc-table > tbody > tr'), // Items to iterate
    extract: ($) => ({ // Data to extract for each item

        logo: $('> td:eq(2) img.coin-logo').attr('src'),

        // The current item will be excluded from results if the name can't be extracted
        name: $('> td:eq(2) p[font-weight="semibold"]').text()?.trim() || Action.EXCLUDE,

        price: $('> td:eq(3)').text()

    }),

    // 3. Processing
    required: ['name', 'price'], // If name or price cannot be extracted, an error will be thrown
    process: async ({ logo, name, price }) => ({ // Normalize / Format the extracted data

        logo,

        name: name.trim(),

        price: parseFloat( price.trim().replace(/[^\d\.]/g, '') )

    }),

})
```

Output:

```json
[
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
        "name": "Bitcoin",
        "price": 48415.71
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
        "name": "Ethereum",
        "price": 3634.48
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png",
        "name": "Cardano",
        "price": 2.49
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
        "name": "Binance Coin",
        "price": 429.91
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
        "name": "Tether",
        "price": 1
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png",
        "name": "XRP",
        "price": 1.12
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
        "name": "Solana",
        "price": 161.09
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png",
        "name": "Polkadot",
        "price": 35.9
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png",
        "name": "Dogecoin",
        "price": 0.2461
    },
    {
        "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
        "name": "USD Coin",
        "price": 1
    }
]
```

### Proxy Rotator

A proxy can be useful if the website you want to scrape has protections against automated traffic
Since most scraping proxies limits the number of requests, we use the included proxy rotator
    to switch to another proxy when we reached the limit on the current one

```typescript
import Scraper, { ProxyRotator } from 'declarative-scraper';

const scraper = new Scraper({
    ...
    proxy: new ProxyRotator({
        zenscrape: {
            prefix: 'https://app.zenscrape.com/api/v1/get?apikey=<key>>&url=',
            getRemaining: () => got('https://app.zenscrape.com/api/v1/status?apikey=<key>>', {
                responseType: 'json'
            }).then(res => {
                console.log(`[proxy][getRemaining] zenscrape`, res.body);
                return res.body['remaining_requests'] as number;
            })
        },
        ...
    })
});
```

## TODO

* Better doc
* Strict type checking
* Fix typings for extracted data
* Tests