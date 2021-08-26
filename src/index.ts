/*----------------------------------
- DEPENDANCES
----------------------------------*/

import Scraper from './Scraper/instance';
import ProxyManager from './ProxyManager'

/*----------------------------------
- TYPES
----------------------------------*/

import { TDonnees, TOptions, TScraperOptions } from './Scraper/types';

/*----------------------------------
- METHODES
----------------------------------*/
const scrape = <TExtractedData extends TDonnees, TProcessedData extends TDonnees>(
    options: TOptions,
    scraper: TScraperOptions<TExtractedData, TProcessedData>
) => new Scraper(options).scrape(scraper);

const subset = <TExtractedData extends TDonnees>(
    options: TScraperOptions<TExtractedData>
) => ({
    _subset: true,
    ...options
})

const setDefaultOptions = (options: Partial<TOptions>) => 
    Scraper.defaultOptions = { ...Scraper.defaultOptions, ...options }

export default { scrape, subset, setDefaultOptions, Proxies: ProxyManager }
export { ProxyManager as ScraperProxies }