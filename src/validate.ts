/*----------------------------------
- DEPENDENCIES
----------------------------------*/

// Npm
import isURL from 'validator/lib/isURL';

// Interval
import { allowedMethods, bodyTypes, TRequestWithExtractors, TExtractors } from './types';

/*----------------------------------
- TYPES
----------------------------------*/

type TObjetDonnees = {[k: string]: any};

class BadRequest extends Error {}

/*----------------------------------
- METHODS
----------------------------------*/

export default (input: TObjetDonnees): TRequestWithExtractors => {

    // TODO: Check remaining requests / minute

    // Method
    if (input.method !== undefined) {
        if (!allowedMethods.includes(input.method))
            throw new BadRequest("Only the following HTTP methods are currently allowed: " + allowedMethods.join(', '));
    } else
        input.method = 'GET';

    // URL
    if (typeof input.url !== "string" || !isURL(input.url, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http', 'https'],
        require_host: true,
        require_port: false,
        allow_protocol_relative_urls: false,
    }))
        throw new BadRequest("The url parameter must be a valid URL string: protocol (http or https) + domain + path (optional)");

    // Cookies
    if (input.cookies !== undefined) {

        // Type
        if (typeof input.cookies !== 'string')
            throw new BadRequest("The cookie parameter must be a string. Example: user=Bob; age=28;");

    }

    // body
    if (input.body !== undefined) {

        // Bodytype
        if (input.bodyType === undefined)
            throw new BadRequest("The bodyType parameter must be provided when the body parameter is specified.");
        if (!bodyTypes.includes(input.bodyType))
            throw new BadRequest("Invalid value for the bodyType parameter. Allowed values: " + bodyTypes.join(', '));

        // Type
        if (typeof input.body !== 'object' || input.body.constructor.name !== 'Object')
            throw new BadRequest("The body parameter must be an object.");
    }

    if (input.extract !== undefined)
        validateExtractors(input.extract, 'extract');

    if (input.withBody !== undefined && typeof input.withBody !== "boolean")
        throw new BadRequest(`The withBody parameter must be a boolean.`);

    if (input.withHeaders !== undefined && typeof input.withHeaders !== "boolean")
        throw new BadRequest(`The withHeaders parameter must be a boolean.`);

    return input as TRequestWithExtractors;
    
}

const validateExtractors = (extract: TObjetDonnees, path: string): TExtractors => {

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

        // @ts-ignore: Property '$foreach' does not exist on type 'TExtractors'
        const { $foreach, ...toExtract } = extract as TExtractors;

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