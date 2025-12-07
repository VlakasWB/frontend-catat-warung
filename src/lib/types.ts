export type ParsedRow = {
  date: string;
  item: string;
  qty: number;
  unit?: string;
  price?: number;
  total?: number;
  type?: string;
  confidence?: number;
  source?: string;
};

export type Detection = {
  index: number;
  text: string;
  score?: number;
  box: [number, number][];
};

export type ScanResult = {
  lines: string[];
  parsed: ParsedRow[];
  used_llm: boolean;
  detections?: Detection[];
  annotated_image_path?: string;
  image_width?: number;
  image_height?: number;
  detection_text_path?: string;
  detection_json_path?: string;
};
