/*----------------------------------
- DEPENDANCES
----------------------------------*/

// npm
import type { Cheerio, Element } from "cheerio"
import type { Options as TGotOptions } from 'got';

import type { TJsonldReader } from '@dopamyn/jsonld-extract';

// Libs
import type Proxies from '../ProxyManager';

/*----------------------------------
- TYPES
----------------------------------*/
export type TDonnees = { [cle: string]: any }

type TFinder = (selector: string) => Cheerio<Element>

export type TOptions = (
    ({ url: string } | { html: string })
    &
    {
        id: string,

        proxy?: Proxies,
        got?: Partial<TGotOptions>,

        debug?: boolean,
        outputDir?: string,

        onError?: (
            type: 'request' | 'extraction' | 'processing', 
            error: Error, 
            options: TOptions,
            scraperOptions: TScraperOptions<{}>
        ) => void
    }
)

export type TScraperOptions<TExtractedData extends TDonnees, TProcessedData extends TDonnees = {}> = {
    items?: ($: TFinder) => Cheerio<Element>,
    extract: (
        TDataList<TExtractedData>
        |
        (($: TFinder, $jsonld: TJsonldReader, element: Cheerio<Element>) => TDataList<TExtractedData>)
    ),
    process?: (data: TExtractedData, index: number) => Promise<TProcessedData | false>,
    required?: string/*(keyof Partial<TExtractedData>)*/[],
}

type TDataList<TExtractedData extends TDonnees> = {
    [name in keyof TExtractedData]: /* Extraction */TScraperOptions<TExtractedData> | /* Raw data */ any
}