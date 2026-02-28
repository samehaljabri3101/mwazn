import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CrValidationResult {
  valid: boolean;
  companyNameAr?: string;
  status?: string;
}

@Injectable()
export class MaroofService {
  private readonly logger = new Logger(MaroofService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('MAROOF_API_KEY') || '';
  }

  async validateCR(crNumber: string): Promise<CrValidationResult> {
    if (!this.apiKey) {
      // Stub mode: just validate format (10 digits)
      const valid = /^\d{10}$/.test(crNumber);
      this.logger.log(`[MAROOF STUB] CR validation for ${crNumber}: ${valid}`);
      return { valid };
    }

    try {
      const response = await fetch(`https://api.maroof.sa/cr/${crNumber}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Maroof API error ${response.status} for CR ${crNumber}`);
        return { valid: false };
      }

      const data: any = await response.json();
      return {
        valid: data.status === 'active' || data.valid === true,
        companyNameAr: data.companyNameAr || data.name_ar,
        status: data.status,
      };
    } catch (err: any) {
      this.logger.warn(`Maroof API call failed: ${err.message}; falling back to format check`);
      return { valid: /^\d{10}$/.test(crNumber) };
    }
  }
}
