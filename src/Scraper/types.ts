/*----------------------------------
- DEPENDANCES
----------------------------------*/

// npm
import type { Cheerio, Element } from "cheerio"
import type { Options as TGotOptions } from 'got';

// Libs
import type { TJsonldReader } from '../utils';
import type Proxies from '../ProxyManager';

/*----------------------------------
- TYPES
----------------------------------*/
export type TDonnees = { [cle: string]: any }

type TFinder = (selector: string) => Cheerio<Element>

type TDataList<TExtractedData extends TDonnees> = {
    [name in keyof TExtractedData]: /* Extraction */TExtractionConfig<TExtractedData> | /* Raw data */ any
}

export type TExtractionConfig<TExtractedData extends TDonnees, TProcessedData extends TDonnees = {}> = {
    items?: ($: TFinder) => Cheerio<Element>,
    extract: (
        TDataList<TExtractedData>
        |
        (($: TFinder, $jsonld: TJsonldReader, element: Cheerio<Element>) => TDataList<TExtractedData>)
    ),
    process?: (data: TExtractedData, index: number) => Promise<TProcessedData | false>,
    required?: string/*(keyof Partial<TExtractedData>)*/[],
    gotOptions?: Partial<TGotOptions>
}

export type TScraperConfig<TExtractedData extends TDonnees, TProcessedData extends TDonnees> = (
    ({ url: string } | { html: string })
    &
    TExtractionConfig<TExtractedData, TProcessedData>
    &
    {
        proxy?: Proxies
    }
)