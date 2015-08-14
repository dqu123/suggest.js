# suggest.js
Javascript autocorrect library built using jQuery.

<h3>Use cases:</h3>
- Dynamic dictionary search: Get definitions of words or search for words by definition.
- Translation dictionary: Translate words, viewing definitions before choosing a suggestion.
- Django ORM Schema Analysis
  - Configure help_text and verbose_name of fields into complex dictionary
  - Map from common names to database column names to facilitate easier queries
  - For example the Young Stellar Object Database <b>ClassLess</b> uses this module to map from names such as Spitzer to specific database names such as S3p6. 
  
<h2>API</h2>
```javascript
/**
 * Make user_input have suggestions appear in suggest_div.
 *
 * @param {string} user_input -- $(selector) for input to add suggestions.
 * @param {string} suggest_div -- $(selector) where suggestions will go.
 * @param {string} delimiter -- Delimiter to tokenize words with.
 *     (Default is ' '.)
 *
 * @effect -- Adds suggest event handler to all appropriate inputs in
 *     $(user_input).
 */
suggest.add(user_input, suggest_div, delimiter);

/**
 * Adds a dictionary to suggestion dictionary.
 *
 * @param {Object} new_dict -- Object representing suggestion dictionary.
 *
 * @effect -- Adds the new_dict's key/value pairs to the current dictionary,
 *     overriding keys that appear in both dictionaries.
 */
suggest.updateDict(new_dict);

/**
 * Sets the suggestion dictionary, replacing the old one.
 *
 * @param {Object} new_dict -- Object representing suggestion dictionary.
 *
 * @effect -- Erases the current dictionary, and sets dict to the given
 *     dictionary.
 */
suggest.setDict(new_dict);

/**
 * Returns suggestion dictionary.
 *
 * @return {Object} -- Suggestion dictionary (Note this is a reference,
 *     not a copy, so any changes to the returned dictionary
 *     will be made to the suggest dictionary).
 */
suggest.getDict();
```
