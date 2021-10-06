/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Npm
import fs from 'fs-extra';
import cheerio, { CheerioAPI, Cheerio, Element } from 'cheerio';
import jsonld from 'jsonld-extract';

// Libs
import { parseFromHTML } from './utils';
export { default as ProxyRotator } from './ProxyRotator'

/*----------------------------------
- TYPE
----------------------------------*/

import { 
    Action,
    TDonnees, Got,
    TInstanceOptions, TExtractor, TRequestExtractor
} from './types';

export { Action } from './types';

/*----------------------------------
- HELPERS
----------------------------------*/

// Builtin support for got
export const gotAdapter = (got: Got) => 
    ({ url, method, body, headers, proxy }: TRequestExtractor) => got({

        url: url,
        method: method,
        body: body, // Form data
        headers: headers,

        // Prend en compte les probabilités d'échec des proxies
        retry: proxy !== undefined ? 5 : 0,

        responseType: 'text',

        isStream: false,
        resolveBodyOnly: true

        // Déconseillé avec proxy, car temps de réponse assez long
        //timeout: 5000

    });

interface TScrapingContext {

    origin?: Error,
    scraper: Scraper, 
    extractor: TExtractor<{}>, 

    html?: string,
    rawItemData?: any,
}

export class ScrapingError extends Error implements TScrapingContext {

    public isScrapingError = true;

    public scraper: Scraper
    public extractor: TExtractor<{}>
    public html?: string

    public origin?: Error
    public rawItemData?: any

    public constructor(
        public message: string,
        context: TScrapingContext
    ) {
        super( message );

        this.scraper = context.scraper;
        this.extractor = context.extractor;
        this.origin = context.origin;

        this.html = context.html;
        this.rawItemData = context.rawItemData;
    }

}

/*----------------------------------
- METHODES
----------------------------------*/
export default class Scraper {
    
    public constructor( private options: TInstanceOptions ) {
        
    }

    public static async scrape<TExtractedData extends TDonnees, TProcessedData extends TDonnees>(
        extractor: TExtractor<TExtractedData, TProcessedData>,
    ): Promise<TProcessedData[]> {

        return await (new Scraper({})).scrape(extractor);

    }

    public async scrape<TExtractedData extends TDonnees, TProcessedData extends TDonnees>( 
        extractor: TExtractor<TExtractedData, TProcessedData>,
    ): Promise<TProcessedData[]> {

        let html: string | undefined;

        if (extractor.debug === undefined)
            extractor.debug = this.options.debug;

        if ('url' in extractor) {

            if (extractor.adapter === undefined)
                extractor.adapter = this.options.adapter;
            if (extractor.adapter === undefined)
                throw new Error(`A request adapter must be specified in options in order to make url requests.`);

            let url = extractor.url;

            if (extractor.proxy === undefined)
                extractor.proxy = this.options.proxy;
            if (extractor.proxy !== undefined) {
                const currentProxy = await extractor.proxy.get();
                url = currentProxy.prefix + url;
            }

            extractor.debug && console.log(`[${extractor.id}] Sending request to ${url}`);

            html = await extractor.adapter({

                ...extractor, 
                url,
                method: extractor.method || 'GET'

            }).catch((error) => {

                throw new ScrapingError('Request to ' + url, {
                    origin: error,
                    scraper: this,
                    extractor
                });

            });

            if (html && this.options.outputDir) {
                const logFile = this.options.outputDir + '/' + extractor.id + '.html';
                fs.outputFileSync(logFile, html);
                extractor.debug && console.info(`[${extractor.id}] Saved output in ${logFile}`);
            }

        } else {

            html = extractor.html;

        }

        if (html === undefined)
            return [];

        // Parsing DOM
        const $ = cheerio.load(html);
        const element = $('html');

        // Extraction de items
        const results = await this.extractItems(extractor, $, element);
        extractor.debug && console.log(`[${extractor.id}] Finished with ${results.length} results`);
        return results;

    }

    private async extractItems<TExtractedData extends TDonnees>(
        extractor: TExtractor<TExtractedData>,
        $: CheerioAPI,
        elements: Cheerio<Element>
    ) {

        // Only one item
        if (extractor.items === undefined) 
            return [
                await this.extractData(extractor, $, elements, 0)
            ];

        // Extract the list of items
        const finder = (selector: string) => elements.find(selector)
        const itemsList = extractor.items( finder ).toArray();
        extractor.debug && console.log(`[${extractor.id}] ${itemsList.length} Items were found`);

        const items = []
        await Promise.all( 
            itemsList.map((item, index) => 
                this.extractData(extractor, $, $(item), index).then((itemData) => {
                    if (itemData !== false) {

                        items.push(itemData);
                        
                        extractor.debug && console.log(`[${extractor.id}] Crawled data`, itemData)

                    }
                }).catch((error) => {

                    switch (this.options.onItemError) {
                        case Action.ERROR: 
                            throw error;
                        case Action.EXCLUDE: 
                            break;
                        // TODO: case Action.IGNORE: 
                        default:
                            console.warn("Unhandled action:", this.options.onItemError);
                    }

                    // If no throw, we print error in console
                    console.error(error);

                })
            ) 
        );

        return items;
    }

    public static subset = <TExtractedData extends TDonnees>( options: TExtractor<TExtractedData> ) => ({
        _subset: true,
        ...options
    })

    // object = scraped data
    // false = exclude current item
    private async extractData<TExtractedData extends TDonnees>(
        extractor: TExtractor<TExtractedData>,
        $: CheerioAPI,
        element: Cheerio<Element>,
        index: number
    ): Promise<TDonnees | false> {

        const finder = (selector: string) => element.find(selector);
        const $jsonld = jsonld($/*, this.options.debug*/);

        const itemData = typeof extractor.extract === 'function'
            ? extractor.extract(finder, $jsonld, element)
            : extractor.extract;
            
        // Extract data
        for (const dataname in itemData) {

            let value = itemData[dataname];
            if (typeof value === 'object' && value._subset === true) {

                value = await this.extractItems(value, $, element).catch((error) => {
                    throw new ScrapingError(`Error while extracting ${dataname}`, {
                        origin: error,
                        scraper: this,
                        extractor,
                        html: element.html(),
                    });

                });
                    
            } else if (typeof value === 'string') {

                value = parseFromHTML(value);
                
            }

            // Exclude item
            if (value === Action.EXCLUDE) {

                return false;

            // Empty value
            } else if (value === undefined || value === null || value === '') {

                const isRequired = extractor.required !== undefined && extractor.required.includes(dataname);
                if (isRequired)
                    throw new ScrapingError("Required data « " + dataname + " » is empty (raw value = " + JSON.stringify(value) + ")", {
                        scraper: this,
                        extractor,
                        html: element.html()
                    });
                else
                    extractor.debug && console.warn(`[${extractor.id}] Empty value for ` + dataname);

                value = undefined;
            }

            itemData[dataname] = value;

        }
        extractor.debug && console.log(`[${extractor.id}] Extracted data (raw):`, itemData);

        if (extractor.process === undefined)
            return itemData;

        // Process data
        const processed = await extractor.process(itemData, index).catch((error) => {
            throw new ScrapingError(`Error while processing extracted data`, {
                origin: error,
                scraper: this,
                extractor,
                html: element.html(),
                rawItemData: itemData
            });
        })

        extractor.debug && processed !== undefined && console.log(`[${extractor.id}] Extracted data (processed)`, processed);
        return processed;
    }
}