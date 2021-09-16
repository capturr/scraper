// Import dependancies
import Scraper, { gotAdapter, ProxyRotator } from '../src';
import got from 'got';

// Configure your scraper
const scraper = new Scraper({

    request: gotAdapter(got),
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

    },

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

});

// Scrape Cryptocurrencies list
scraper.scrape({

    // 1. Basic options
    id: 'cryptocurrencies', // Identifier for debugging
    url: 'https://coinmarketcap.com/', // URL address to scrape

    // 2. Extraction
    items: $ => $('table.cmc-table > tbody > tr'), // Items to iterate
    extract: ($) => ({ // Data to extract for each item

        logo: $('> td:eq(2) img.coin-logo').attr('src'),

        name: $('> td:eq(2) p[font-weight="semibold"]').text(),

        price: $('> td:eq(3)').text()

    }),

    // 3. Processing
    required: ['name', 'price'], // If name or price cannot be extracted, the item will be excluded from results
    process: async ({ logo, name, price }) => ({ // Normalize / Format the extracted data

        logo,

        name: name.trim(),

        price: parseFloat( price.trim().replace(/[^\d\.]/g, '') )

    }),

}).then((result) => {

    // Print result
    console.log(result);

    /*
        Prints the following array:
    
        [
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
                name: 'Bitcoin',
                price: 48415.71
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
                name: 'Ethereum',
                price: 3634.48
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
                name: 'Cardano',
                price: 2.49
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
                name: 'Binance Coin',
                price: 429.91
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
                name: 'Tether',
                price: 1
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
                name: 'XRP',
                price: 1.12
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
                name: 'Solana',
                price: 161.09
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png',
                name: 'Polkadot',
                price: 35.9
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
                name: 'Dogecoin',
                price: 0.2461
            },
            {
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
                name: 'USD Coin',
                price: 1
            }
        ]
    */

})