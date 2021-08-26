/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Npm
import fs from 'fs-extra';
import got from 'got';
import cheerio, { CheerioAPI, Cheerio, Element } from 'cheerio';

import jsonld from '@dopamyn/jsonld-extract';

// Libs
import { parseFromHTML } from '../utils';

/*----------------------------------
- TYPE
----------------------------------*/

import type { TDonnees, TOptions, TScraperOptions } from './types';

/*----------------------------------
- METHODES
----------------------------------*/
export default class Scraper {

    public static defaultOptions: Partial<TOptions> = {};
    
    private options: TOptions;

    public constructor( options: TOptions ) {
        this.options = { ...Scraper.defaultOptions, ...options };
    }

    private log = (...args: any[]) => this.options.debug &&
        console.log(`[scraper][${this.options.id}]`, ...args); 

    private warn = (...args: any[]) => //this.options.debug &&
        console.warn(`[scraper][${this.options.id}]`, ...args); 

    public async scrape<TExtractedData extends TDonnees, TProcessedData extends TDonnees>( 
        config: TScraperOptions<TExtractedData, TProcessedData>,
    ): Promise<TProcessedData[]> {

        let html: string | undefined;

        if ('url' in this.options) {
            let url = this.options.url;
            if (this.options.proxy !== undefined) {
                const proxy = await this.options.proxy.get();
                url = proxy.prefix + url;
            }

            this.log(`Requete vers ${url}`);

            try {
                html = await got(url, {

                    // Prend en compte les probabilités d'échec des proxies
                    retry: this.options.proxy !== undefined ? 5 : 0,

                    ...(this.options.got || {}),

                    responseType: 'text',

                    isStream: false,
                    resolveBodyOnly: true

                    // Déconseillé avec proxy, car temps de réponse assez long
                    //timeout: 5000

                })
            } catch (e) {

                if (this.options.onError)
                    this.options.onError('request', e, this.options, config);
                else
                    throw e;
                
            }

            if (html && this.options.outputDir) {
                const fichierLocal = this.options.outputDir + '/' + this.options.id + '.html';
                fs.outputFileSync(fichierLocal, html);
            }

        } else {

            html = this.options.html;

        }

        // Extraction code html
        if (html === undefined)
            return [];

        // Interprétation du dom
        const $ = cheerio.load(html);
        const element = $('html');

        // Extraction de items
        const results = await this.extractItems(config, $, element);

        this.log(`Terminé.`);

        return results;

    }

    private async extractItems<TExtractedData extends TDonnees>(
        config: TScraperOptions<TExtractedData>,
        $: CheerioAPI,
        elements: Cheerio<Element>
    ) {

        // Si config.items = undefined, extractData directement
        if (config.items === undefined) 
            return [
                await this.extractData(config, $, elements, 0)
            ];

        const finder = (selector: string) => elements.find(selector)
        const itemsList = config.items( finder ).toArray();

        this.log(`[${this.options.id}] ${itemsList.length} Items trouvés`);
        if (itemsList.length === 0 && this.options.debug) {

            const fichierLocal = this.options.outputDir + '/' + this.options.id + '.html';
            fs.outputFileSync(fichierLocal, $.root().html());

            // Pas normal
            this.warn(`Aucun résultat trouvé. html enregistré dans ${fichierLocal}`);

        }

        const items = []

        await Promise.all( 
            itemsList.map((item, index) => 
                this.extractData(config, $, $(item), index).then((itemData) => {
                    if (itemData) {

                        items.push(itemData);
                        
                        this.log(`[${this.options.id}] Crawled data`, itemData)

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
        config: TScraperOptions<TExtractedData>,
        $: CheerioAPI,
        element: Cheerio<Element>,
        index: number
    ): Promise<TDonnees | false> {

        const finder = (selector: string) => element.find(selector);
        const $jsonld = jsonld($/*, this.options.debug*/);

        const itemData = typeof config.extract === 'function'
            ? config.extract(finder, $jsonld, element)
            : config.extract;
            
        for (const dataname in itemData) {

            let value = itemData[dataname];
            if (typeof value === 'object' && value._subset === true) {

                try {

                    value = await this.extractItems(value, $, element);

                } catch (error) {

                    this.warn(`[extractData] Erreur lors de l'extraction de ${dataname}:`, error);
                    value = null;

                    if (this.options.onError)
                        this.options.onError('extraction', error, this.options, config);
                }
                    
            } else if (typeof value === 'string') {

                value = parseFromHTML(value);
                
            }

            // Echec de l'extraction
            if (value === undefined || value === null || value === '') {

                const exclude = config.required !== undefined && config.required.includes(dataname);
                this.warn(`[extractData] Echec de l'extraction de ` + dataname, exclude ? "Exclusion de l'item" : '');
                if (exclude)
                    return false;

                value = undefined;
            }

            // assignation de la valeur extraite

            itemData[dataname] = value;

        }

        this.log('[extractData]', this.options.id, 'Données brutes extraites:', itemData);

        if (config.process !== undefined) {

            try {

                const processResult = await config.process(itemData, index);
                if (processResult === false)
                    return false;

                this.log('[extractData]', this.options.id, 'Données après traitement:', processResult);

                return processResult;
                
            } catch (error) {

                this.warn('[extractData]', this.options.id, "Erreur lors du traitement des données", error);

                if (this.options.onError)
                    this.options.onError('processing', error, this.options, config);

                return false;
                
            }
        }

        return itemData;
    }
}