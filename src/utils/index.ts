/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Npm
import { decode as htmlDecode } from 'html-entities';
import condenseWhitespace from 'condense-whitespace';

/*----------------------------------
- METHODES
----------------------------------*/
export function parseFromHTML(val: string): string {
    return condenseWhitespace( htmlDecode(val) );
}