/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Npm
import fs from 'fs-extra';
import got, { Options as TGotOptions } from 'got';
import cheerio, { CheerioAPI, Cheerio, Element, Document, Node } from 'cheerio';

import getProxy from './proxies';
import { jsonldreader, TJsonldReader } from './utils';

/*----------------------------------
- CONFIG
----------------------------------*/

const dummyDir = 'crawlers/dummy';
const debugDir = 'crawlers/debug';

const debug = true;
const useDummy = false;

/*----------------------------------
- TYPE
----------------------------------*/

type TDonnees = { [cle: string]: any }

type TFinder = (selector: string) => Cheerio<Element>

type TDataList<TExtractedData extends TDonnees> = {
    [name in keyof TExtractedData]: /* Extraction */TExtractionConfig<TExtractedData> | /* Raw data */ any
}

type TDataExtractors<TExtractedData extends TDonnees> = (
    TDataList<TExtractedData>
    |
    (($: TFinder, $jsonld: TJsonldReader, element: Cheerio<Element>) => TDataList<TExtractedData>)
)

type TExtractionConfig<TExtractedData extends TDonnees, TProcessedData extends TDonnees = {}> = {
    items?: ($: TFinder) => Cheerio<Element>,
    extract: TDataExtractors<TExtractedData>,
    process?: (data: TExtractedData, index: number) => Promise<TProcessedData | false>,
    required?: (keyof Partial<TExtractedData>)[],
    gotOptions?: Partial<TGotOptions>
}

export type TCrawlerConfig<TExtractedData extends TDonnees, TProcessedData extends TDonnees> = ({ url: string } | { html: string }) & {
    proxy?: boolean
} & TExtractionConfig<TExtractedData, TProcessedData>;

/*----------------------------------
- METHODES
----------------------------------*/
export async function scrape<TExtractedData extends TDonnees, TProcessedData extends TDonnees>( 
    waveId: string, 
    crawler: TCrawlerConfig<TExtractedData, TProcessedData>,
): Promise<TProcessedData[]> {

    let html: string | undefined;

    if ('url' in crawler) {

        // Mode local = chargement html via local
        // Evite les appels api inutiles, les derniers ayantun cout
        const fichierLocal = dummyDir + '/' + waveId + '.html';
        if (useDummy && process.env.environnement === 'local' && fs.existsSync(fichierLocal)) {

            console.log(`[scraper] Chargement de ${crawler.url} via fichier local: ${fichierLocal}`);
            html = fs.readFileSync(fichierLocal);

        } else {

            let url = crawler.url;
            if (crawler.proxy === true) {
                const proxy = await getProxy();
                url = proxy.prefix + url;
            }

            console.log(`[scraper] Requete vers ${url}`);

            try {
                html = await got(url, {

                    // Prend en compte les probabilités d'échec des proxies
                    retry: crawler.proxy === true ? 5 : 0,

                    ...(crawler.gotOptions || {}),

                    responseType: 'text',

                    isStream: false,
                    resolveBodyOnly: true

                    // Déconseillé avec proxy, car temps de réponse assez long
                    //timeout: 5000

                })
            } catch (e) {

                console.error(`[scraper][${waveId}] Erreur lors du crawling de ${url}`, e);
                throw e;
                
            }

            if (html && debug) {
                const fichierLocal = debugDir + '/' + waveId + '.html';
                fs.outputFileSync(fichierLocal, html);
            }

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
    const results = await extractItems(crawler, $, element, waveId);

    console.log(`[scraper] Terminé.`);

    return results;

}

export const subset = <TExtractedData extends TDonnees>(options: TExtractionConfig<TExtractedData>) => ({
    _subset: true,
    ...options
})

async function extractItems<TExtractedData extends TDonnees>(
    crawler: TExtractionConfig<TExtractedData>,
    $: CheerioAPI,
    elements: Cheerio<Element>,
    waveId: string,
) {

    const debug = true;

    // Si crawler.items = undefined, extractData directement
    if (crawler.items === undefined) 
        return [
            await extractData(crawler, $, elements, waveId, 0)
        ];

    const finder = (selector: string) => elements.find(selector)
    const itemsList = crawler.items( finder ).toArray();

    debug && console.log(`[scraper][${waveId}] ${itemsList.length} Items trouvés`);
    if (itemsList.length === 0 && debug) {

        const fichierLocal = debugDir + '/' + waveId + '.html';
        fs.outputFileSync(fichierLocal, $.root().html());

        // Pas normal
        console.warn(`Aucun résultat trouvé. html enregistré dans ${fichierLocal}`);

    }

    const items = []

    await Promise.all( 
        itemsList.map((item, index) => 
            extractData(crawler, $, $(item), waveId, index).then((itemData) => {
                if (itemData) {

                    items.push(itemData);
                    
                    debug && console.log(`[scraper][${waveId}] Crawled data`, itemData)

                }
            })
        ) 
    );

    return items;
}

// object = données crawlées
// 0 = exclusion de l'item
// -1 = Arrêt de l'itération des résultats
async function extractData<TExtractedData extends TDonnees>(
    crawler: TExtractionConfig<TExtractedData>,
    $: CheerioAPI,
    element: Cheerio<Element>,
    waveId: string,
    index: number
): Promise<TDonnees | false> {

    const finder = (selector: string) => element.find(selector);
    const $jsonld = jsonldreader($);

    const itemData = typeof crawler.extract === 'function'
        ? crawler.extract(finder, $jsonld, element)
        : crawler.extract;
        
    for (const dataname in itemData) {

        let value = itemData[dataname];
        if (typeof value === 'object' && typeof value.extract === 'function') {

            try {

                value = await extractItems(value, $, element, waveId);

            } catch (error) {

                console.warn(`[scraper][extractData] Erreur lors de l'extraction de ${dataname}:`, error);

                value = null;
            }
                
        } else
            value = value;

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

    debug && console.log('[scraper][extractData]', waveId, 'Données brutes extraites:', itemData);

    if (crawler.process !== undefined) {

        try {

            const processResult = await crawler.process(itemData, index);
            if (processResult === false)
                return false;

            debug && console.log('[scraper][extractData]', waveId, 'Données après traitement:', processResult);

            return processResult;
            
        } catch (error) {

            debug && console.warn('[scraper][extractData]', waveId, "Erreur lors du traitement des données", error);
            return false;
            
        }
    }

    return itemData;
}