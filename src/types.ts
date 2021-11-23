export type TRequestWithExtractors = TRequestOptions & {
    extract?: TExtractors,
    withBody?: boolean,
    withHeaders?: boolean,
}

/*----------------------------------
- REQUEST
----------------------------------*/

export const allowedMethods = ["GET", "POST"];
export const bodyTypes = ["form", "json"];

// Request
export type TRequestOptions = {
    url: string,
    method?: HttpMethod,
    cookies?: string,
} & ({} | {
    body: { [cle: string]: any },
    bodyType: typeof bodyTypes[number]
})

export type HttpMethod = typeof allowedMethods[number];

/*----------------------------------
- SCRAPER
----------------------------------*/

export type TExtractors = TValueExtractor | TItemsExtractor;

export type TValueExtractor = [
    selector: "this" | string,
    attribute: "text" | "html" | string,
    required: boolean,
    ...filters: string[]
]

export type TItemsExtractor = (
    { $foreach?: string } // un ou plusieurs selecteurs CSS, séparés par une vigule
    &
    { [name: string]: TExtractors }
)

export type TScrapeResult<TData extends any = any> = {
    url: string,
    status: number,
    headers?: { [cle: string]: string },
    body?: string,
    data?: TData
}