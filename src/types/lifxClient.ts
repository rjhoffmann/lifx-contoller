export type ListResponse = {
  id: string;
  uuid: string;
  label: string;
  connected: boolean;
  power: string;
  color: Color;
  brightness: number;
  effect: string;
  group: Group;
  location: Location;
  product: Product;
  relays?: RelayList;
  zones?: ZoneList;
  chain?: ChainList;
  last_seen: string;
  seconds_since_seen: number;
}

export type Color = {
  hue: number;
  saturation: number;
  kelvin: number;
};

export type Group = {
  id: string;
  name: string;
};

export type Location = {
  id: string;
  name: string;
};

export type Product = {
  name: string;
  identifier: string;
  company: string;
  capabilities: ProductCapabilities;
  product_id: number;
  vendor_id: number;
};

export type ProductCapabilities = {
  has_color: boolean;
  has_variable_color_temp: boolean;
  has_ir: boolean;
  has_chain: boolean;
  has_multizone: boolean;
  min_kelvin: number;
  max_kelvin: number;
};

export type RelayList = {
  count: number;
  relays: {
    index: number;
    label: string;
    group_label: string;
    group_id: string;
    power: string;
    mode: string;
  }[];
};

export type ZoneList = {
  count: number;
  zones: {
    brightness: number;
    hue: number;
    kelvin: number;
    saturation: number;
    zone: number;
  }[];
};

export type ChainList = {
  count: number;
  children: {
    height: number;
    index: number;
    user_x: number;
    user_y: number;
    width: number;
  }[];
}