/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Npm
import fs from 'fs-extra';
import got from 'got';
import cheerio, { CheerioAPI, Cheerio, Element, Document, Node } from 'cheerio';

// Libs
import { jsonldreader, parseFromHTML } from '../utils';

/*----------------------------------
- CONFIG
----------------------------------*/

// TODO: Configure from Scraper instanciation
const debugDir = 'crawlers/debug';
const debug = true;

/*----------------------------------
- TYPE
----------------------------------*/

import type { TDonnees, TScraperConfig, TExtractionConfig } from './types';

/*----------------------------------
- METHODES
----------------------------------*/
export default class Scraper {

    public constructor(
        private id: string
    ) {

    }

    public async scrape<TExtractedData extends TDonnees, TProcessedData extends TDonnees>( 
        crawler: TScraperConfig<TExtractedData, TProcessedData>,
    ): Promise<TProcessedData[]> {

        let html: string | undefined;

        if ('url' in crawler) {

            let url = crawler.url;
            if (crawler.proxy !== undefined) {
                const proxy = await crawler.proxy.get();
                url = proxy.prefix + url;
            }

            console.log(`[scraper] Requete vers ${url}`);

            try {
                html = await got(url, {

                    // Prend en compte les probabilités d'échec des proxies
                    retry: crawler.proxy !== undefined ? 5 : 0,

                    ...(crawler.gotOptions || {}),

                    responseType: 'text',

                    isStream: false,
                    resolveBodyOnly: true

                    // Déconseillé avec proxy, car temps de réponse assez long
                    //timeout: 5000

                })
            } catch (e) {

                console.error(`[scraper][${this.id}] Erreur lors du crawling de ${url}`, e);
                throw e;
                
            }

            if (html && debug) {
                const fichierLocal = debugDir + '/' + this.id + '.html';
                fs.outputFileSync(fichierLocal, html);
            }

        } else {

            html = crawler.html;

        }

        // Extraction code html
        if (html === undefined)
            return;

        // Interprétation du dom
        const $ = cheerio.load(html);
        const element = $('html');

        // Extraction de items
        const results = await this.extractItems(crawler, $, element);

        console.log(`[scraper] Terminé.`);

        return results;

    }

    private async extractItems<TExtractedData extends TDonnees>(
        crawler: TExtractionConfig<TExtractedData>,
        $: CheerioAPI,
        elements: Cheerio<Element>
    ) {

        const debug = true;

        // Si crawler.items = undefined, extractData directement
        if (crawler.items === undefined) 
            return [
                await this.extractData(crawler, $, elements, 0)
            ];

        const finder = (selector: string) => elements.find(selector)
        const itemsList = crawler.items( finder ).toArray();

        debug && console.log(`[scraper][${this.id}] ${itemsList.length} Items trouvés`);
        if (itemsList.length === 0 && debug) {

            const fichierLocal = debugDir + '/' + this.id + '.html';
            fs.outputFileSync(fichierLocal, $.root().html());

            // Pas normal
            console.warn(`Aucun résultat trouvé. html enregistré dans ${fichierLocal}`);

        }

        const items = []

        await Promise.all( 
            itemsList.map((item, index) => 
                this.extractData(crawler, $, $(item), index).then((itemData) => {
                    if (itemData) {

                        items.push(itemData);
                        
                        debug && console.log(`[scraper][${this.id}] Crawled data`, itemData)

                    }
                })
            ) 
        );

        return items;
    }

    // object = données crawlées
    // 0 = exclusion de l'item
    // -1 = Arrêt de l'itération des résultats
    private async extractData<TExtractedData extends TDonnees>(
        crawler: TExtractionConfig<TExtractedData>,
        $: CheerioAPI,
        element: Cheerio<Element>,
        index: number
    ): Promise<TDonnees | false> {

        const finder = (selector: string) => element.find(selector);
        const $jsonld = jsonldreader($);

        const itemData = typeof crawler.extract === 'function'
            ? crawler.extract(finder, $jsonld, element)
            : crawler.extract;
            
        for (const dataname in itemData) {

            let value = itemData[dataname];
            if (typeof value === 'object' && value._subset === true) {

                try {

                    value = await this.extractItems(value, $, element);

                } catch (error) {

                    console.warn(`[scraper][extractData] Erreur lors de l'extraction de ${dataname}:`, error);

                    value = null;
                }
                    
            } else {

                value = parseFromHTML(value);
                
            }

            // Echec de l'extraction
            if (value === undefined || value === null || value === '') {

                const exclude = crawler.required !== undefined && crawler.required.includes(dataname);
                console.warn(`[scraper][extractData] Echec de l'extraction de ` + dataname, exclude ? "Exclusion de l'item" : '');
                if (exclude)
                    return false;

                value = undefined;
            }

            // assignation de la valeur extraite

            itemData[dataname] = value;

        }

        debug && console.log('[scraper][extractData]', this.id, 'Données brutes extraites:', itemData);

        if (crawler.process !== undefined) {

            try {

                const processResult = await crawler.process(itemData, index);
                if (processResult === false)
                    return false;

                debug && console.log('[scraper][extractData]', this.id, 'Données après traitement:', processResult);

                return processResult;
                
            } catch (error) {

                debug && console.warn('[scraper][extractData]', this.id, "Erreur lors du traitement des données", error);
                return false;
                
            }
        }

        return itemData;
    }
}