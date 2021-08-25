import Scraper from './Scraper/instance';
import ProxyManager from './ProxyManager'

import { TDonnees, TScraperConfig, TExtractionConfig } from './Scraper/types';

export const scrape = <TExtractedData extends TDonnees, TProcessedData extends TDonnees>(
    id: string,
    config: TScraperConfig<TExtractedData, TProcessedData>
) => new Scraper(id).scrape(config);

export const subset = <TExtractedData extends TDonnees>(
    options: TExtractionConfig<TExtractedData>
) => ({
    _subset: true,
    ...options
})

export default { scrape, subset, Proxies: ProxyManager }
export type ScraperProxies = ProxyManager