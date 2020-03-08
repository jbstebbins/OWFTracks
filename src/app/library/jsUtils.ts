export class jsUtils {

    constructor() { }

    // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    public uuidv4(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public countChars(str, schar) {
        let regex = new RegExp(schar, "gi");
        return str.length - str.replace(regex, '').length;
    }

    public convertDMSDD(coordinates): number {
        let dms = coordinates.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
        var d = Number(dms[0]);
        var m = Number(dms[1]);
        var s = Number(dms[2].replace(/[NSEW]/gi, ""));
        var dir = "+";
        if (coordinates.includes("W") || coordinates.includes("S")) {
            dir = "-";
        }

        var dd = (((dir === "-") ? -1 : 1) * d) + ((m / 60) + (s / 3600));
        return dd;
    }

    public convertDDMDD(coordinates): number {
        let ddm = coordinates.replace(/[^-\. 0-9a-z]/gi, '').split(" ");

        var d = Number(ddm[0]);
        var m = Number(ddm[1].replace(/[NSEW]/gi, ""));
        var dir = "+";
        if (coordinates.includes("W") || coordinates.includes("S")) {
            dir = "-";
        }

        var dd = (((dir === "-") ? -1 : 1) * d) + (m / 60);
        return dd;
    }

    public convertDDToDDM(latitude, longitude): string {
        return this.convertDDLatitudeToDDM(latitude) + ", " +
            this.convertDDLongitudeToDDM(longitude);
    }

    public convertDDLongitudeToDDM(longitude): string {
        var lon = Number(longitude);
        var dir = (lon >= 0 ? 'E' : 'W');
        lon = Math.abs(lon);
        var d = Math.floor(lon);
        var m = ((lon - d) * 60).toFixed(4);
        return d + '° ' + m + '\' ' + dir;
    }

    public convertDDLatitudeToDDM(latitude): string {
        var lat = Number(latitude);
        var dir = (lat >= 0 ? 'N' : 'S');
        lat = Math.abs(lat);
        var d = Math.floor(lat);
        var m = ((lat - d) * 60).toFixed(4);
        return d + '° ' + m + '\' ' + dir;
    }

    public convertDDToDMS(latitude, longitude): string {
        return this.convertDDLatitudeToDMS(latitude) + ", " +
            this.convertDDLongitudeToDMS(longitude);
    }

    public convertDDLongitudeToDMS(longitude): string {
        var lon = Number(longitude);
        var dir = (lon >= 0 ? 'E' : 'W');
        lon = Math.abs(lon);
        var d = Math.floor(lon);
        var m = Math.floor((lon - d) * 60);
        var s = ((lon - d - (m / 60)) * 3600).toFixed(2);
        return d + '° ' + m + '\' ' + s + '" ' + dir;
    }

    public convertDDLatitudeToDMS(latitude): string {
        var lat = Number(latitude);
        var dir = (lat >= 0 ? 'N' : 'S');
        lat = Math.abs(lat);
        var d = Math.floor(lat);
        var m = Math.floor((lat - d) * 60);
        var s = ((lat - d - (m / 60)) * 3600).toFixed(2);
        return d + '° ' + m + '\' ' + s + '" ' + dir;
    }

    public convertDMSToDD(latitude, longitude): string {
        return this.convertDMSLatitudeToDD(latitude) + ", " +
            this.convertDMSLongitudeToDD(longitude);
    }

    public convertDMSToDDM(latitude, longitude): string {
        return this.convertDDLatitudeToDDM(this.convertDMSLatitudeToDD(latitude)) + ", " +
            this.convertDDLongitudeToDDM(this.convertDMSLongitudeToDD(longitude))
    }

    public convertDMSLongitudeToDD(longitude): number {
        var dms = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
        var d = Number(dms[0]);
        var m = Number(dms[1]);
        var s = Number(dms[2].replace(/[EW]/gi, ""));

        var dir = "+";
        if (longitude.includes("W")) {
            dir = "-";
        }

        var dm = m + (s / 60);
        d = ((dir === "-") ? -1 : 1) * d;
        var dd = d + (dm / 60);
        return dd;
    }

    public convertDMSLatitudeToDD(latitude): number {
        var dms = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
        var d = Number(dms[0]);
        var m = Number(dms[1]);
        var s = Number(dms[2].replace(/[NS]/gi, ""));

        var dir = "+";
        if (latitude.includes("S")) {
            dir = "-";
        }

        var dm = m + (s / 60);
        d = ((dir === "-") ? -1 : 1) * d;
        var dd = d + (dm / 60);
        return dd;
    }

    public convertDDMToDD(latitude, longitude): string {
        return this.convertDDMLatitudeToDD(latitude) + ", " +
            this.convertDDMLongitudeToDD(longitude);
    }

    public convertDDMToDMS(latitude, longitude): string {
        return this.convertDDLatitudeToDMS(this.convertDDMLatitudeToDD(latitude)) + ", " +
            this.convertDDLongitudeToDMS(this.convertDDMLongitudeToDD(longitude))
    }

    public convertDDMLongitudeToDD(longitude): number {
        var ddm = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
        var d = Number(ddm[0]);
        var m = Number(ddm[1].replace(/[EW]/gi, ""));

        var dir = "+";
        if (longitude.includes("S")) {
            dir = "-";
        }

        d = ((dir === "-") ? -1 : 1) * d;
        var dd = d + (m / 60);
        return dd;
    }

    public convertDDMLatitudeToDD(latitude): number {
        var ddm = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
        var d = Number(ddm[0]);
        var m = Number(ddm[1].replace(/[NS]/gi, ""));

        var dir = "+";
        if (latitude.includes("S")) {
            dir = "-";
        }

        d = ((dir === "-") ? -1 : 1) * d;
        var dd = d + (m / 60);
        return dd;
    }

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
    /*
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
    */
}
