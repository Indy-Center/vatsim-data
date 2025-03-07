export type VatsimData = {
  general: VatsimGeneral;
  pilots: VatsimPilot[];
  controllers: VatsimController[];
  atis: VatsimAtis[];
  servers: VatsimServer[];
  prefiles: VatsimPrefile[];
  facilities: VatsimFacility[];
  ratings: VatsimRating[];
  pilot_ratings: VatsimPilotRating[];
  military_ratings: VatsimMilitaryRating[];
};

export type VatsimPilot = {
  cid: number;
  name: string;
  callsign: string;
  server: string;
  pilot_rating: number;
  military_rating: number;
  lattitude: number;
  longitude: number;
  altitude: number;
  groundspeed: number;
  transponder: string;
  qnh_i_hg: number;
  qnh_mb: number;
  flight_plan: VatsimFlightPlan | null;
  logon_time: string;
  last_updated: string;
};

export type VatsimController = {
  cid: number;
  name: string;
  callsign: string;
  frequency: number;
  facility: number;
  rating: number;
  server: string;
  visual_range: number;
  text_atis: string[];
  last_updated: string;
  logon_time: string;
};

export type VatsimAtis = VatsimController & {
  atis_code: string;
};

export type VatsimServer = {
  ident: string;
  hostname_or_ip: string;
  location: string;
  name: string;
  clients_connection_allowed: number;
  client_connections_allowed: boolean;
  is_sweatbox: boolean;
};

export type VatsimFacility = {
  id: number;
  short: string;
  long: string;
};

export type VatsimRating = {
  id: number;
  short: string;
  long: string;
};

export type VatsimPilotRating = {
  id: number;
  short_name: string;
  long_name: string;
};

export type VatsimMilitaryRating = {
  id: number;
  short_name: string;
  long_name: string;
};

export type VatsimGeneral = {
  version: number;
  reload: number;
  update: string;
  update_timestamp: string;
  connected_clients: number;
  unique_users: number;
};

export type VatsimFlightPlan = {
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
  remarks: string;
  route: string;
  revision_id: number;
  assigned_transponder: string;
};

export type VatsimPrefile = VatsimFlightPlan;
