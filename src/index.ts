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

import type { 
    TDonnees, Got,
    TInstanceOptions, TExtractor, TRequestExtractor
} from './index.d';

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

export class ScrapingError extends Error {

    public constructor(
        message: string | Error,
        public operation: 'request' | 'extraction' | 'processing',
        public scraper: Scraper,
        public extractor?: TExtractor<{}>,
    ) {
        super( typeof message === "string" ? message : message.message );
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

            }).catch((e) => {

                throw new ScrapingError(e, 'request', this, extractor);

            });

            if (html && this.options.outputDir) {
                const fichierLocal = this.options.outputDir + '/' + extractor.id + '.html';
                fs.outputFileSync(fichierLocal, html);
            }

        } else {

            html = extractor.html;

        }

        // Extraction code html
        if (html === undefined)
            return [];

        // Interprétation du dom
        const $ = cheerio.load(html);
        const element = $('html');

        // Extraction de items
        const results = await this.extractItems(extractor, $, element);

        extractor.debug && console.log(`[${extractor.id}] Finished.`);

        return results;

    }

    private async extractItems<TExtractedData extends TDonnees>(
        extractor: TExtractor<TExtractedData>,
        $: CheerioAPI,
        elements: Cheerio<Element>
    ) {

        // Si extractor.items = undefined, extractData directement
        if (extractor.items === undefined) 
            return [
                await this.extractData(extractor, $, elements, 0)
            ];

        const finder = (selector: string) => elements.find(selector)
        const itemsList = extractor.items( finder ).toArray();

        extractor.debug && console.log(`[${extractor.id}] ${itemsList.length} Items were found`);
        
        // Log file
        if (this.options.outputDir) {

            const logFile = this.options.outputDir + '/' + extractor.id + '.html';
            fs.outputFileSync(logFile, $.root().html());

            // Pas normal
            extractor.debug && console.warn(`Aucun résultat trouvé. html enregistré dans ${logFile}`);

        }

        const items = []
        await Promise.all( 
            itemsList.map((item, index) => 
                this.extractData(extractor, $, $(item), index).then((itemData) => {
                    if (itemData) {

                        items.push(itemData);
                        
                        extractor.debug && console.log(`[${extractor.id}] Crawled data`, itemData)

                    }
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

                value = await this.extractItems(value, $, element).catch((e) => {

                    extractor.debug && console.warn(`[${extractor.id}] Error while extracting ${dataname}:`, e);
                    //value = null;
                    throw new ScrapingError(e, 'extraction', this, extractor);

                });
                    
            } else if (typeof value === 'string') {

                value = parseFromHTML(value);
                
            }

            // No value extracted
            if (value === undefined || value === null || value === '') {

                const isRequired = extractor.required !== undefined && extractor.required.includes(dataname);
                extractor.debug && console.warn(`[${extractor.id}] Empty value for ` + dataname, isRequired ? "(required)" : '(optionnal)');
                if (isRequired)
                    throw new ScrapingError("Required data « " + dataname + " » is empty", 'extraction', this, extractor);

                value = undefined;
            }

            itemData[dataname] = value;

        }
        extractor.debug && console.log(`[${extractor.id}] Extracted data (raw):`, itemData);

        if (extractor.process === undefined)
            return itemData;

        // Process data
        const processed = await extractor.process(itemData, index).catch((error) => {

            extractor.debug && console.warn(`[${extractor.id}] Error while processing extracted data`, error);

            throw new ScrapingError(error, 'processing', this, extractor);

        })

        extractor.debug && console.log(`[${extractor.id}] Extracted data (processed)`, processed);
        return processed;
    }
}