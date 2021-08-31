/*----------------------------------
- DEPENDANCES
----------------------------------*/

import Scraper from './Scraper/instance';
import ProxyManager from './ProxyManager'

/*----------------------------------
- TYPES
----------------------------------*/

import {
    TDonnees, HttpMethod,
    TOptions, TRequestOptions, TOptionsWithRequest, TOptionsWithHtml,
    TScraperActions 
} from './Scraper/types';

/*----------------------------------
- METHODES
----------------------------------*/
const scrape = <TExtractedData extends TDonnees, TProcessedData extends TDonnees>(
    options: TOptions,
    scraper: TScraperActions<TExtractedData, TProcessedData>
) => new Scraper(options).scrape(scraper);

const subset = <TExtractedData extends TDonnees>(
    options: TScraperActions<TExtractedData>
) => ({
    _subset: true,
    ...options
})

const setDefaultOptions = (options: Partial<TOptions>) => 
    Scraper.defaultOptions = { ...Scraper.defaultOptions, ...options }

export default { scrape, subset, setDefaultOptions, Proxies: ProxyManager }
export { ProxyManager as ScraperProxies }

export type TScraperOptions = TOptions
export type TScraperRequestOptions = TRequestOptions
export type TScraperOptionsWithRequest = TOptionsWithRequest
export type TScraperOptionsWithHtml = TOptionsWithHtml
export type THttpMethod = HttpMethod