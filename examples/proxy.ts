// Import packages
import Scraper from '../src';
import got from 'got';

// Configure proxy to bypass captcha & other anti-bot verification
const proxyRotator = new Scraper.Proxies({

    // A tendance à etre plus rapide que scraperapi
    zenscrape: {
        prefix: 'https://app.zenscrape.com/api/v1/get?apikey=<key>>&url=',
        getRemaining: () => got('https://app.zenscrape.com/api/v1/status?apikey=<key>>', {
            responseType: 'json'
        }).then(res => {
            console.log(`[proxy][getRemaining] zenscrape`, res.body);
            return res.body['remaining_requests'] as number;
        })
    },

    scraperapi: {
        prefix: 'http://api.scraperapi.com/?api_key=<key>>&url=',
        getRemaining: () => got('http://api.scraperapi.com/account?api_key=<key>>', {
            responseType: 'json'
        }).then(res => {
            console.log(`[proxy][getRemaining] scraperapi`, res.body);
            return res.body['requestLimit'] - res.body['requestCount'];
        })
    },

})

// Set global configuration
Scraper.setDefaultOptions({
    // Show debug infos 
    debug: true,
    // Handle errors
    onError: (type, error, options, scraper) => {

        console.error(
            `An ${type} error eccured while scraping data from ${options["url"] || 'HTML'}:`,
            error,
            '|| options =', options,
            '|| scraper =', scraper
        );

    }
});

// Scrape Cryptocurrencies list
Scraper.scrape({

    // Identifier for debugging
    id: 'cryptocurrencies',
    // URL address to scrape
    url: 'https://coinmarketcap.com/',
    // Proxy Rotator instance (optional)
    proxy: proxyRotator,

}, {

    // Items to iterate (optional)
    items: $ => $('table.cmc-table > tbody > tr'),
    // Data to extract for each item
    extract: ($) => ({

        logo: $('> td:eq(2) img.coin-logo').attr('src'),

        name: $('> td:eq(2) p[font-weight="semibold"]').text(),

        price: $('> td:eq(3)').text()

    }),
    // If name or price cannot be extracted, the item will be excluded from results
    required: ['name', 'price'],
    // Normalize / Format the extracted data (optional)
    process: async ({ logo, name, price }) => ({

        logo,

        name: name.trim(),

        price: parseFloat( price.trim().replace(/[^\d\.]/g, '') )

    }),

}).then((result) => {

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

})