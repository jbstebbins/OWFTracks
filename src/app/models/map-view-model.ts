export class MapViewModel {
    bounds: Bounds;
    center: LatLon;
    range: number;
    scale: number;
    zoom: number;
    basemap: string;
    spatialReference: number;
    coordinateFormat: string;
    mapId: number;
    requestor: string;
    time: TimeSpanTime;

    constructor(bounds: Bounds, center: LatLon, range: number, scale: number, zoom: number, 
        basemap: string, spatialReference: number, coordinateFormat: string, mapId: number,
        requestor: string, time: TimeSpanTime) {
        this.bounds = bounds;
        this.center = center;
        this.range = range;
        this.scale = scale;
        this.zoom = zoom;
        this.basemap = basemap;
        this.spatialReference = spatialReference;
        this.coordinateFormat = coordinateFormat;
        this.mapId = mapId;
        this.requestor = requestor;
        this.time = time;
	}
}

export class Bounds {
    southWest: LatLon;
    northEast: LatLon;

    constructor(southWest: LatLon, northEast: LatLon) {
        this.southWest = southWest;
        this.northEast = northEast;
    }
}

export class LatLon {
    lat: number;
    lon: number;

    constructor(lat: number, lon: number) {
        this.lat = lat;
        this.lon = lon;
    }
}

export class TimeSpanTime {
    timeSpan: TimeSpan;
    timeSpans: TimeSpan[];
    timeStamp: string;

    constructor(timeSpan: TimeSpan, timeSpans: TimeSpan[], timeStamp: string) {
        this.timeSpan = timeSpan;
        this.timeSpans = timeSpans;
        this.timeStamp = timeStamp
    }
}

export class TimeSpan {
    begin: string;
    end: string;

    constructor(begin: string, end: string) {
        this.begin = begin;
        this.end = end;
    }
}