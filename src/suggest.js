/**
 * @fileoverview Suggest (autocorrect) Javascript module.
 * @author davidqu12345@gmail.com (David Qu)
 * Uses jQuery. 
 */
"use strict";


// Add suggest object as global
var suggest = (function() {
    // Object that becomes suggest object.
    var obj = {};

    // Suggestion dictionary.
    var suggest_dict = {};
    
    // Constants
    var ENTER_KEY = 13;
    var DOWN_ARROW_KEY = 40;
    var N_KEY = 78;

    /**
     * Adds a dictionary to suggestion dictionary.
     *
     * @param {Object} new_dict -- Object representing suggestion dictionary.
     *
     * @effect -- Adds the new_dict's key/value pairs to the current dictionary,
     *     overriding keys that appear in both dictionaries.
     */
    obj.updateDict = function(new_dict) {
        // Adds keys to dictionary.
        for (var key in new_dict) {
            suggest_dict[key] = new_dict[key]
        }
    };

    /**
     * Sets the suggestion dictionary, replacing the old one.
     *
     * @param {Object} new_dict -- Object representing suggestion dictionary.
     *
     * @effect -- Erases the current dictionary, and sets dict to the given
     *     dictionary.
     */
    obj.setDict = function(new_dict) {
        suggest_dict = {};
        obj.updateDict(new_dict);
    }

    /**
     * Returns suggestion dictionary.
     *
     * @return {Object} -- Suggestion dictionary (Note this is a reference,
     *     not a copy, so any changes to the returned dictionary 
     *     will be made to the suggest dictionary).
     */
    obj.getDict = function() {
        return suggest_dict;
    };

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
    obj.add = function(user_input, suggest_div, delimiter) {
        // Default delimiter
        delimiter = typeof delimiter === 'undefined' ? ' ' : delimiter;

        // Iterate through selector elements, only adding to text/textarea
        var num_elements = $(user_input).length;
        for (var i = 0; i < num_elements; i++) {
            var element = $(user_input)[i];
            switch (element.type) {
                case "textarea": 
                case "text":
                    addEventHandler(element, suggest_div, delimiter); 
                    break;
                // Fail silently for other inputs
                default:
                    break;
            }
        }
    }

    
    /**
     * Adds an event handler to a form element, 
     * giving autocorrect suggestions on 'keyup' 
     * when some exist.
     *
     * @param {string} user_input -- jQuery selector for input to correct.
     * @param {string} suggest_div -- jQuery selector for div to place suggestions.
     * 
     * @effect -- Adds event handler to user input to make suggestions.
     */
    function addEventHandler(user_input, suggest_div, delimiter) {
        $(user_input).on('keyup', function(evt) {
            if (evt.keyCode === DOWN_ARROW_KEY ||
                (evt.ctrlKey && evt.keyCode === N_KEY)) {
                $(suggest_div).find('select').focus();
            }
            else {
                var text = $(user_input).val();
                
                // Clear suggestions if empty.
                if (text === '') {
                    $(suggest_div).empty();
                }

                // Tokenize text into words.
                var tokens = tokenize(text, delimiter);
                
                // Add suggestion for each word.
                for (var i = 0; i < tokens.length; i++) {
                    var matches = matchDict(tokens[i].text, suggest_dict);
                    makeSuggestion(user_input, suggest_div, tokens[i], matches);
                }
            }
        });
    }
    
    /**
     * Converts a string into tokens based on a delimiter.
     * 
     * @param {string} text -- Text to convert to tokens.
     * @param {string} delimiter -- delimiter that separates tokens.
     * 
     * @return {array} -- Array of token objects where each object
     *     has text, begin, and end fields. Begin and end correspond
     *     to indices in the original text string of the token.
     */
    function tokenize(text, delimiter) {
        var search_index = 0;
        var token_array = [];
        while (true) {
            var new_index = text.indexOf(delimiter, search_index);

            // Delimiter not found.
            if (new_index === -1) {
                var token_text = text.substring(search_index, text.length);
                if (token_text !== '') {
                    var token = {};
                    token.text = token_text;
                    token.begin = search_index;
                    token.end = text.length;
                    token_array.push(token);
                }
                break;
            }
            // Found delimiter, add and search for next.
            else {
                var token_text = text.substring(search_index, new_index);
                if (token_text !== '') {
                    var token = {};
                    token.text = token_text;
                    token.begin = search_index;
                    token.end = new_index;
                    token_array.push(token);
                }
                search_index = new_index + 1;
            }
        }
        return token_array;
    }

    /**
     * Return an array of matching objects where
     * each object has two attributes key and value.
     *
     * @param {string} word -- partial word that user is typing.
     * @return {array} -- Returns an array of match objects 
     *     that have key, value, and help_text attributes.
     */
    function matchDict(word, dict) {
        /**
         * Helper function for processing dictionary keys.
         *
         * @param {string} dict_key -- Dictionary key
         * @param {string or object} dict_value -- Dictionary value
         *     which may be a string of object depending on whether
         *     a simple dictionary or a translation dictionary is desired.
         *
         * @effect -- Adds match objects to the array if they have a match in
         *     either key, value, or help_text.
         */
        function process(dict_key, dict_value) {
            switch (typeof dict_value) {
                case 'string':
                    // Call helper function. (Note add also checks for matching).
                    add(word, dict_key, dict_value, '');
                    break;
                case 'object':
                    var obj_keys = Object.keys(dict_value);
                    // Process arrays recursively. 
                    if (Array.isArray(dict_value)) {
                        for (var i = 0; i < dict_value.length; i++) {
                            // Make recursive call.
                            process(dict_key, dict_value[i]);
                        }
                    }
                    // A non-array object implies "Translation" mode, 
                    // which maps from keys to translation objects
                    // with help_text, key, and value
                    else if (~obj_keys.indexOf('value')) {
                        // Add help text if it exists
                        var help_str = '';
                        if (~obj_keys.indexOf('help_text')) {
                            help_str = dict_value['help_text'];
                        }

                        // Call helper function.
                        add(word, dict_key, dict_value['value'], help_str);
                    }
                    break;
                // Ignore other types
                default: 
                    break;
            }
        }

        /**
         * Helper function for comparing words against a dictionary
         *     and adding a translation object to the results array.
         * 
         * @param {string} word -- The text that the user has typed.
         * @param {string} key -- The original word in the dictionary.
         * @param {string} value_str -- The translated word.
         * @param {string} help_str -- The definition of the word.
         *
         * @effect -- Add translation objects with key, value_str, and 
         *     help_text fields to the array.
         */
        function add(word, key, value_str, help_str) {
            // Switch to lower case for matching.
            var word = word.toLowerCase();
            if (~(key).toLowerCase().indexOf(word) ||
                ~(value_str).toLowerCase().indexOf(word) ||
                ~(help_str).toLowerCase().indexOf(word)) {
                // Add to array
                arr.push({'key': key, 'value': value_str, 'help_text': help_str});
            }
        }

        // Result array
        var arr = [];
        
        for (var key in dict) {
            // Call helper function.
            process(key, dict[key]);
        }

        return arr;    
    }

    /**
     * Make a suggestion select to replace text with suggestions.
     *
     * @param {string} user_input -- jQuery selector for input to correct.
     * @param {string} suggest_div -- jQuery selector for div to place suggestions.
     * @param {string} original -- Original token object.
     * @param {Array} suggestions -- Array of suggestion objects.
     *
     * @effect -- Adds suggestion select to the suggest_div.
     */
    function makeSuggestion(user_input, suggest_div, original, suggestions) {
        /**
         * Helper function to show help_text.
         *
         * @effect -- Adds help text to .suggest-prompt div contained in the
         *     suggest_div.
         */
        function showHelp() { 
            var search = $(select).find(':selected').nextAll().andSelf();
            var num_display = 1;

            // Clear out div.
            $(suggest_div).find('.suggest-prompt').empty();
            
            // Add help text.
            for (var i = 0; i < Math.min(num_display, search.length); i++) {
                $(suggest_div).find('.suggest-prompt').append(
                    search[i].value + ' -- ' + search[i].title + '<br/>' 
                );
            }
        }

        // Clear out suggestion div.
        $(suggest_div).empty();

        if (suggestions.length !== 0) {
            // Create a select.
            var select = document.createElement('select');
            select.multiple = true;
            
            // Add options for each suggestion.
            for (var i = 0; i < suggestions.length; i++) {
                var s = suggestions[i]
                var option = document.createElement('option');
                option.value = s.value;
                option.text = s.value + ' (' + s.key + ')';
                option.title = s.help_text;
                
                // Select first option.
                if (i === 0) {
                    option.selected = true;
                }
                select.appendChild(option);
            }

            // Add select to suggestion div.
            $(suggest_div).append('<i>By <b>' + original.text + 
                '</b>, did you mean:</i><br/><div class="suggest-prompt"></div>');
            $(suggest_div).append(select);
            
            // Replace text event handler.
            $(select).on('keydown click', function(evt) {
                // Listen for Enter key or click.
                if (evt.keyCode === ENTER_KEY ||
                    evt.type === 'click') {
                    evt.preventDefault();
                                        var old_text = $(user_input).val();
                    $(user_input).val(old_text.substr(0, original.begin) + 
                                      select.value + old_text.substr(original.end));
                    $(suggest_div).empty();
                    $(user_input).focus();
                }
                // Shortcut hotkeys. Currently doesn't work.
                else if (evt.ctrlKey && evt.keyCode === N_KEY) {
                    $(document).trigger('keypress', [DOWN_ARROW_KEY]);
                }
            });

            // Show first help text by default.
            showHelp();

            // Show help text of selected option.
            $(select).on('change focus', function(evt) { 
                showHelp();
            });
        }
    }
    
    return obj;
})();
