export type EarlyAccessSignupInput = {
  display_name?: string;
  email: string;
  interest?: 'general' | 'features' | 'testing' | 'documentation' | 'other' | null;
  opted_in: boolean;
};
