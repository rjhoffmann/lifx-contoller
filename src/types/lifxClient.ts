export type ListLightsResponse = {
  id: string;
  uuid: string;
  label: string;
  connected: boolean;
  power: string;
  color: {
    hue: number;
    saturation: number;
    kelvin: number;
  };
  brightness: number;
  group: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
  };
  product: {
    name: string;
    identifier: string;
    company: string;
    capabilities: {
      has_color: boolean;
      has_variable_color_temp: boolean;
      has_ir: boolean;
      has_chain: boolean;
      has_multizone: boolean;
      min_kelvin: number;
      max_kelvin: number;
    };
  };
}