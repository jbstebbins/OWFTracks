export class jsUtils {

	constructor() { }

    // https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data
    /*
    re_valid = r"""
        # Validate a CSV string having single, double or un-quoted values.
        ^                                   # Anchor to start of string.
        \s*                                 # Allow whitespace before value.
        (?:                                 # Group for value alternatives.
        '[^'\\]*(?:\\[\S\s][^'\\]*)*'     # Either Single quoted string,
        | "[^"\\]*(?:\\[\S\s][^"\\]*)*"     # or Double quoted string,
        | [^,'"\s\\]*(?:\s+[^,'"\s\\]+)*    # or Non-comma, non-quote stuff.
        )                                   # End group of value alternatives.
        \s*                                 # Allow whitespace after value.
        (?:                                 # Zero or more additional values
        ,                                 # Values separated by a comma.
        \s*                               # Allow whitespace before value.
        (?:                               # Group for value alternatives.
            '[^'\\]*(?:\\[\S\s][^'\\]*)*'   # Either Single quoted string,
        | "[^"\\]*(?:\\[\S\s][^"\\]*)*"   # or Double quoted string,
        | [^,'"\s\\]*(?:\s+[^,'"\s\\]+)*  # or Non-comma, non-quote stuff.
        )                                 # End group of value alternatives.
        \s*                               # Allow whitespace after value.
        )*                                  # Zero or more additional values
        $                                   # Anchor to end of string.
    """

    re_value = r"""
        # Match one value in valid CSV string.
        (?!\s*$)                            # Don't match empty last value.
        \s*                                 # Strip whitespace before value.
        (?:                                 # Group for value alternatives.
        '([^'\\]*(?:\\[\S\s][^'\\]*)*)'   # Either $1: Single quoted string,
        | "([^"\\]*(?:\\[\S\s][^"\\]*)*)"   # or $2: Double quoted string,
        | ([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)  # or $3: Non-comma, non-quote stuff.
        )                                   # End group of value alternatives.
        \s*                                 # Strip whitespace after value.
        (?:,|$)                             # Field ends on comma or EOS.
    */

    // Return array of string values, or NULL if CSV string not well formed.
    public CSVtoArray(text): any {
        var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
        var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;

        // Return NULL if input string is not well formed CSV string.
        if (!re_valid.test(text)) return null;

        var a = [];                     // Initialize array to receive values.
        text.replace(re_value, // "Walk" the string using replace with callback.
            function(m0, m1, m2, m3) {
                // Remove backslash from \' in single quoted values.
                if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
                // Remove backslash from \" in double quoted values.
                else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
                else if (m3 !== undefined) a.push(m3);
                return ''; // Return empty string.
            });

        // Handle special case of empty last value.
        if (/,\s*$/.test(text)) a.push('');

        return a;
    };
}
