import {Deserializable} from "../interfaces/deserializable";

export class CotTrackModel implements Deserializable {
    type: string;
    features: CotTrackFeature[];
    totalFeatures: string;
    numberReturned: number;
    timeStamp: string;
    crs: CotTrackCrs;

    deserialize(input: any): this {
        Object.assign(this, input);

        let feature: CotTrackFeature;
        input.features.array.forEach(element => {
            feature = new CotTrackFeature().deserialize(element);
            this.features.push(feature);
        });

        this.crs = new CotTrackCrs().deserialize(input.crs);
        return this;
    }
}

export class CotTrackFeature implements Deserializable {
    type: string;
    id: string;
    geometry: CotTrackGeometry;
    geometry_name: string;
    properties: CotTrackProperties;
    totalFeatures: number;
    numberReturned: number;
    timeStamp: string;

    deserialize(input: any): this {
        Object.assign(this, input);
        this.geometry = new CotTrackGeometry().deserialize(input.geometry);
        this.properties = new CotTrackProperties().deserialize(input.properties);
        return this;
    }
}

export class CotTrackCrs implements Deserializable {
    type: string;
    properties: {
        name: string;
    };

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}

export class CotTrackGeometry implements Deserializable {
    type: string;
    coordinates: any[];

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}

export class CotTrackProperties implements Deserializable {
    name: string;
    type: string;
    fid: string;
    class: string;
    category: string;
    alertLevel: string;
    threat: string;
    dimension: string;
    flag: string;
    speed: number;
    dtg: Date;
    altitude: number;
    course: number;
    classification: string;

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
