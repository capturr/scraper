/*----------------------------------
- DEPENDENCIES
----------------------------------*/

// Npm
import getRootDomain from 'get-root-domain';
import isURL from 'validator/lib/isURL';

// Interval
import { 
    /* const */allowedMethods, bodyTypes, dataFilters, 
    /* types */TRequestWithExtractors, TExtractor , TValueExtractor, ValueExtractor
} from './types';

/*----------------------------------
- TYPES
----------------------------------*/

type TObjetDonnees = {[k: string]: any};

class BadRequest extends Error {}

/*----------------------------------
- CONFIG
----------------------------------*/

const reqPerCall = 3;

/*----------------------------------
- METHODS
----------------------------------*/

export default (requests: TRequestWithExtractors | TObjetDonnees): TRequestWithExtractors[] => {

    // Type Check
    if (!Array.isArray( requests ))
        throw new BadRequest("requests must be an array. Provided: " + typeof requests);

    // Requests number / call
    const reqCount = requests.length;
    if (reqCount === 0)
        throw new BadRequest("You must provide at least one request.");
    if (reqCount > reqPerCall)
        throw new BadRequest("You can't send more than " + reqPerCall + " requests per call (" + reqCount + " given).");

    // Check every request
    const domains: {[domain: string]: true} = {};
    for (let iReq = 0; iReq < reqCount; iReq++) {
        
        const req = requests[iReq];

        // Type
        if (typeof req !== "object" || req === null)
            throw new BadRequest("requests must be an array of requests object, but requests[" + iReq + "] is an " + typeof req);

        // Method
        if (req.method === undefined)
            req.method = 'GET';
        else if(!allowedMethods.includes(req.method))
            throw new BadRequest("Only the following HTTP methods are currently allowed: " + allowedMethods.join(', '));

        // URL
        if (typeof req.url !== "string" || !isURL(req.url, {
            require_protocol: true,
            require_valid_protocol: true,
            protocols: ['http', 'https'],
            require_host: true,
            require_port: false,
            allow_protocol_relative_urls: false,
        }))
            throw new BadRequest("The url parameter must be a valid URL string: protocol (http or https) + domain + path (optional)");

        // Unique domain
        if (reqCount !== 1) {
            
            const domain = getRootDomain(req.url);
            if (domains[domain] === true)
                throw new BadRequest("When you send multiple requests in one call, each requets must point to different domain names. However, you're sending 2 requests to " + domain + ".");

            domains[domain] = true;

        }

        // Cookies
        if (req.cookies !== undefined) {

            // Type
            if (typeof req.cookies !== 'string')
                throw new BadRequest("The cookie parameter must be a string. Example: user=Bob; age=28;");

        }

        // body
        if (req.body !== undefined) {

            // Bodytype
            if (req.bodyType === undefined)
                throw new BadRequest("The bodyType parameter must be provided when the body parameter is specified.");
            if (!bodyTypes.includes(req.bodyType))
                throw new BadRequest("Invalid value for the bodyType parameter. Allowed values: " + bodyTypes.join(', '));

            // Type
            if (typeof req.body !== 'object' || req.body.constructor.name !== 'Object')
                throw new BadRequest("The body parameter must be an object.");
        }

        if (req.extract !== undefined)
            req.extract = validateExtractors(req.extract, 'extract');

        if (req.withBody !== undefined && typeof req.withBody !== "boolean")
            throw new BadRequest(`The withBody parameter must be a boolean.`);

        if (req.withHeaders !== undefined && typeof req.withHeaders !== "boolean")
            throw new BadRequest(`The withHeaders parameter must be a boolean.`);

    }

    return requests as TRequestWithExtractors[];
    
}

export const isValueExtractor = (extract: TValueExtractor | TObjetDonnees): extract is TValueExtractor => 
    ('select' in extract) && ('attr' in extract)

const validateExtractors = (extract: ValueExtractor | TValueExtractor | TObjetDonnees, path: string): TExtractor => {

    if (!extract || typeof extract !== 'object')
        throw new BadRequest("The " + path + " option must be an object or an array (" + typeof extract + " given).");
        
    if (extract instanceof ValueExtractor)
        extract = extract.options;

    // The two required options in TValueExtractor
    if (isValueExtractor(extract)) {

        /*
            extract: { 
                select: "h4", 
                attr: "text", 
                required: true, 
                filters: ["title"] 
            }
        */

        const { select, attr, required, filters } = extract;

        if (typeof select !== "string" || typeof attr !== "string" || typeof required !== "boolean")
            throw new BadRequest("When the " + path + " option is an array, it must contain at least 3 values: "
                + "CSS select (string), attribute (string), required (boolean) and optionnaly filters (strings)");

        for (const filter of filters)
            if (!dataFilters.includes( filter ))
                throw new BadRequest("The filter \"" + filter + "\" you gave in " + path + " does not exists. Possible filters: " + dataFilters.join(', '));

    } else {

        /*
            extract: {
                "$foreach": ".sh-dgr__content",
                "name": ["h4", "text", true, "title"],
                ...
            }
        */

        if (Object.keys(extract).length === 0)
            throw new BadRequest("The " + path + " parameter must contain at least one entry.");

        // For each extractor
        for (const name in extract) {

            // Foreach
            if (name !== '$foreach')
                extract[name] = validateExtractors(extract[name], path + '.' + name);
            else if (typeof extract[name] !== "string")
                throw new BadRequest("When specified, the " + path + ".$foreach parameter must be a CSS selector string.");


        }
    }

    return extract;

}