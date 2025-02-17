export type VatsimData = {
    id: string;
    data: any;
    hash: string;
    timestamp: Date;
}

export type Pilot = {
    // Unique Identifier
    id: string;
    // Unique Hash for looking up pilots
    hash: string;

    // Pilot Data
    cid: number;
    callsign: string;
    name: string;
    qnh_mb: number;
    heading: number;
    altitude: number;
    latitude: number;
    qnh_i_hg: number;
    longitude: number;
    groundspeed: number;
    transponder: string;
    military_rating: number;
    pilot_rating: number;

    // Connection State
    status: string;
    // Time that a pilot has officially been considered connected.
    logon_time: Date;
    // Last time that this pilot was seen as connected
    last_seen: Date;
    // Time that a pilot has officially been considered disconnected.
    disconnected_at: Date;
}