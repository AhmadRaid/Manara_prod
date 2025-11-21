export class CreateServiceFeatureDto {
  readonly title: string;
  readonly description: string;
  readonly rate?: number;
  readonly countRate?: number;
  readonly countUsers?: number;
  readonly price: number;
  readonly period: string;
  readonly time: string;
  readonly image?: string;
  readonly countOrders?: number;
  readonly featureServices?: string[];
  readonly filesNeeded?: string[];
  readonly stepGetService?: string[];
  readonly vedio?: string;
  readonly status?: 'pending' | 'waitApprove' | 'complete';
}
