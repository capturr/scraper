/*----------------------------------
- REQUEST
----------------------------------*/

export const allowedMethods = ["GET", "POST"];
export const bodyTypes = ["form", "json"];

export type TRequestWithExtractors = TRequest & {
    extract?: TExtractor,
    withBody?: boolean,
    withHeaders?: boolean,
}

export type TRequest = TBasicRequest | TRequestWithBody;

export type TBasicRequest = {
    url: string,
    method?: HttpMethod,
    cookies?: string,
}

export type TRequestWithBody = TBasicRequest & {
    body: { [key: string]: any },
    bodyType: typeof bodyTypes[number]
}

export type HttpMethod = typeof allowedMethods[number];

/*----------------------------------
- SCRAPER
----------------------------------*/

export type TExtractor = TValueExtractor | TItemsExtractor;

export type TValueExtractor = [
    selector: "this" | string,
    attribute: "text" | "html" | string,
    required: boolean,
    ...filters: string[]
]

export type TItemsExtractor = (
    { $foreach?: string } // un ou plusieurs selecteurs CSS, séparés par une vigule
    &
    { [name: string]: TExtractor }
)

/*----------------------------------
- RESPONSE
----------------------------------*/

export type TScrapeResult<TData extends any = any> = {
    url: string,
    status: number,
    headers?: { [key: string]: string },
    body?: string,
    data?: TData
}