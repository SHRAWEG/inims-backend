import { ApiResponse } from './api-response.type';

export interface ChartDataset {
  /** Display label for this dataset */
  label: string;
  /** Numerical data points — one per label */
  data: number[];
  /** Optional color hint for frontend rendering */
  color?: string;
}

export interface ChartResponse {
  /** X-axis labels (dates, category names, etc.) */
  labels: string[];
  /** One or more datasets to plot */
  datasets: ChartDataset[];
  /** Optional aggregate summary values */
  summary?: Record<string, number>;
}

export type ChartApiResponse = ApiResponse<ChartResponse>;
