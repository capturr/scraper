/*----------------------------------
- DEPENDENCIES
----------------------------------*/

// Npm
import getRootDomain from 'get-root-domain';
import isURL from 'validator/lib/isURL';

// Interval
import { allowedMethods, bodyTypes, TRequestWithExtractors, TExtractor } from './types';

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

export default (requests: TObjetDonnees): TRequestWithExtractors[] => {

    // TODO: Check remaining requests / minute

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
            validateExtractors(req.extract, 'extract');

        if (req.withBody !== undefined && typeof req.withBody !== "boolean")
            throw new BadRequest(`The withBody parameter must be a boolean.`);

        if (req.withHeaders !== undefined && typeof req.withHeaders !== "boolean")
            throw new BadRequest(`The withHeaders parameter must be a boolean.`);

    }

    return requests as TRequestWithExtractors[];
    
}

const validateExtractors = (extract: TObjetDonnees, path: string): TExtractor => {

    if (!extract || typeof extract !== 'object')
        throw new BadRequest("The " + path + " option must be an object or an array (" + typeof extract + " given).");

    if (Array.isArray( extract )) {

        /*
            extract: ["h4", "text", true, "title"]
        */

        if (extract.length < 3 || typeof extract[0] !== "string" || typeof extract[1] !== "string" || typeof extract[2] !== "boolean")
            throw new BadRequest("When the " + path + " option is an array, it must contain at least 3 values: "
                + "CSS selector (string), attribute (string), required (boolean) and optionnaly filters (strings)");

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

        // @ts-ignore: Property '$foreach' does not exist on type 'TExtractor'
        const { $foreach, ...toExtract } = extract as TExtractor;

        // Foreach
        if ($foreach !== undefined && typeof $foreach !== "string")
            throw new BadRequest("When specified, the " + path + ".$foreach parameter must be a CSS selector string.");

        // For each extractor
        for (const name in toExtract) {

            validateExtractors(toExtract[name], path + '.' + name);

        }
    }

    return extract;

}