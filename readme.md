# Dopamyn Scraper

## Documentation

Soon

## Usage Example

```typescript

// Import package
import Scraper from '@dopamyn/scraper';

// Configure proxy to bypass captcha & other anti-bot verification
const proxyRotator = new Scraper.Proxies({

    scraperapi: {
        prefix: 'http://api.scraperapi.com/?api_key=<apikey>&url=',
        getRemaining: () => got('http://api.scraperapi.com/account?api_key=<apikey>', {
            responseType: 'json'
        }).then(res => {
            debug && console.log(`[proxy][getRemaining] scraperapi`, res.body);
            return res.body['requestLimit'] - res.body['requestCount'];
        })
    },

});

// Scrape Cryptocurrencies list
const result = await Scraper.scrape('google.search', {
    url: 'https://coinmarketcap.com/',
    proxy: proxyRotator,
    items: $ => $('table.cmc-table > tbody > tr'),
    extract: ($) => ({

        logo: $('> td:eq(2) img.coin-logo').attr('src'),

        name: $('> td:eq(2) p[font-weight="semibold"]').text(),

        price: $('> td:eq(3)').text()

    }),
    required: ['name', 'price'],
    process: async ({ logo, name, price }) => ({

        logo,

        name: name.trim(),

        price: parseFloat( price.trim() )

    }),
})

// Print result
console.log(result);

/*
    Prints the following array:

    [{
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
        name: "Bitcoin",
        price: 47669.92

    }, {
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
        name: "Ethereum",
        price: 3139.49

    }, ...]
*/
```