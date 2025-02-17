export type VatsimDataResponse = {
  general: {
    version: number;
    reload: number;
    update: string;
    update_timestamp: string;
    connected_clients: number;
    unique_users: number;
  };
  pilots: Pilot[];
};

export type Pilot = {
  cid: number;
  name: string;
  callsign: string;
  server: string;
  pilot_rating: number;
  military_rating: number;
  latitude: number;
  longitude: number;
  altitude: number;
  groundspeed: number;
  transponder: string;
  heading: number;
  qnh_i_hg: number;
  qnh_mb: number;
  flight_plan?: FlightPlan;
  logon_time: string;
  last_updated: string;
};

export type FlightPlan = {
  flight_rules: string;
  aircraft: string;
  aircraft_faa: string;
  aircraft_short: string;
  departure: string;
  arrival: string;
  alternate: string;
  cruise_tas: string;
  altitude: string;
  deptime: string;
  enroute_time: string;
  fuel_time: string;
  remarks: string;
  route: string;
  revision_id: number;
  assigned_transponder: string;
};

export type Facility = {
  id: number;
  short: string;
  long: string;
};

export type Rating = {
  id: number;
  short: string;
  long: string;
};

export type PilotRating = {
  id: number;
  short_name: string;
  long_name: string;
};

export type MilitaryRating = {
  id: number;
  short_name: string;
  long_name: string;
};

// Utility type for mapping rating IDs to their descriptions
export type RatingMap = Record<number, { short: string; long: string }>;
export type PilotRatingMap = Record<number, { short_name: string; long_name: string }>;
export type MilitaryRatingMap = Record<number, { short_name: string; long_name: string }>;
