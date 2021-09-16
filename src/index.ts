/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Npm
import fs from 'fs-extra';
import cheerio, { CheerioAPI, Cheerio, Element } from 'cheerio';
import jsonld from 'jsonld-extract';

// Libs
import { parseFromHTML } from './utils';
export { default as ProxyManager } from './ProxyManager'

/*----------------------------------
- TYPE
----------------------------------*/

import type { 
    TDonnees, Got,
    TInstanceOptions, TExtractor, TRequestExtractor
} from './types';

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

            if (extractor.request === undefined)
                extractor.request = this.options.request;
            if (extractor.request === undefined)
                throw new Error(`A proxy adapter must be specified in options in order to make url requests.`);

            let url = extractor.url;

            if (extractor.proxy === undefined)
                extractor.proxy = this.options.proxy;
            if (extractor.proxy !== undefined) {
                const currentProxy = await extractor.proxy.get();
                url = currentProxy.prefix + url;
            }

            extractor.debug && console.log(`Requete vers ${url}`);

            try {
                html = await extractor.request({
                    ...extractor, 
                    url,
                    method: extractor.method || 'GET'
                });
            } catch (e) {

                if (this.options.onError)
                    this.options.onError('request', e, this, extractor);
                else
                    throw e;
                
            }

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

        extractor.debug && console.log(`Terminé.`);

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

        extractor.debug && console.log(`[${extractor.id}] ${itemsList.length} Items trouvés`);
        if (itemsList.length === 0 && this.options.outputDir) {

            const fichierLocal = this.options.outputDir + '/' + extractor.id + '.html';
            fs.outputFileSync(fichierLocal, $.root().html());

            // Pas normal
            extractor.debug && console.warn(`Aucun résultat trouvé. html enregistré dans ${fichierLocal}`);

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

    // object = données crawlées
    // 0 = exclusion de l'item
    // -1 = Arrêt de l'itération des résultats
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
            
        for (const dataname in itemData) {

            let value = itemData[dataname];
            if (typeof value === 'object' && value._subset === true) {

                try {

                    value = await this.extractItems(value, $, element);

                } catch (error) {

                    extractor.debug && console.warn(`[extractData] Erreur lors de l'extraction de ${dataname}:`, error);
                    value = null;

                    if (this.options.onError)
                        this.options.onError('extraction', error, this, extractor);
                }
                    
            } else if (typeof value === 'string') {

                value = parseFromHTML(value);
                
            }

            // Echec de l'extraction
            if (value === undefined || value === null || value === '') {

                const exclude = extractor.required !== undefined && extractor.required.includes(dataname);
                extractor.debug && console.warn(`[extractData] Echec de l'extraction de ` + dataname, exclude ? "Exclusion de l'item" : '');
                if (exclude)
                    return false;

                value = undefined;
            }

            // assignation de la valeur extraite

            itemData[dataname] = value;

        }

        extractor.debug && console.log('[extractData]', extractor.id, 'Données brutes extraites:', itemData);

        if (extractor.process !== undefined) {

            try {

                const processResult = await extractor.process(itemData, index);
                if (processResult === false)
                    return false;

                extractor.debug && console.log('[extractData]', extractor.id, 'Données après traitement:', processResult);

                return processResult;
                
            } catch (error) {

                extractor.debug && console.warn('[extractData]', extractor.id, "Erreur lors du traitement des données", error);

                if (this.options.onError)
                    this.options.onError('processing', error, this, extractor);

                return false;
                
            }
        }

        return itemData;
    }
}