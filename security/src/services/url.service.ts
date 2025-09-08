import axios from 'axios';
import { UrlScanResult } from '../types';

/**
 * Service for scanning URLs and checking if they are safe or malicious
 * using the VirusTotal API
 */
export class UrlScanService {
  private apiKey: string;
  private baseUrl = 'https://www.virustotal.com/api/v3/urls';

  /**
   * Creates a new UrlScanService instance
   * @param apiKey - The VirusTotal API key
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('VirusTotal API key is required');
    }
    this.apiKey = apiKey;
  }


  /**
   * Submits a URL for scanning to VirusTotal and returns the scan id
   */
  async submitUrl(url: string): Promise<string> {
    try {
      // VirusTotal requires the URL to be base64 encoded (URL-safe, no padding)
      const urlBuffer = Buffer.from(url);
      const urlBase64 = urlBuffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return urlBase64;
    } catch (error) {
      throw new Error('Failed to encode URL for VirusTotal');
    }
  }


  /**
   * Retrieves scan results from VirusTotal by encoded URL
   */
  async getScanResult(encodedUrl: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${encodedUrl}`,
        {
          headers: {
            'x-apikey': this.apiKey
          }
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Not found
        return null;
      }
      throw new Error('Failed to retrieve scan results from VirusTotal');
    }
  }


  /**
   * Gets and processes scan results from VirusTotal
   */
  async getAndProcessResults(url: string): Promise<UrlScanResult> {
    const encodedUrl = await this.submitUrl(url);
    const rawResult = await this.getScanResult(encodedUrl);
    if (!rawResult) {
      throw new Error('No scan results found for this URL');
    }
    return this.processResults(rawResult, url);
  }


  /**
   * Processes raw VirusTotal results into a standardized format
   */
  private processResults(rawResult: any, url: string): UrlScanResult {
  // VirusTotal v3 returns a data object with attributes
  const attr = rawResult.data?.attributes || {};
  const categories = attr.categories || {};
  const lastAnalysisStats = attr.last_analysis_stats || {};

    // Determine if malicious
    const maliciousCount = lastAnalysisStats.malicious || 0;
    const suspiciousCount = lastAnalysisStats.suspicious || 0;
    const harmlessCount = lastAnalysisStats.harmless || 0;
    const undetectedCount = lastAnalysisStats.undetected || 0;
    const total = maliciousCount + suspiciousCount + harmlessCount + undetectedCount;
    const score = total > 0 ? Math.round((maliciousCount + suspiciousCount * 0.5) / total * 100) : 0;
    const isMalicious = maliciousCount > 0 || suspiciousCount > 0;

    // Category
    const categoryValues = Object.values(categories).filter((v) => typeof v === 'string');
    const primaryCategory = categoryValues[0] || 'uncategorized';

    return {
      isSafe: !isMalicious,
      category: primaryCategory,
      score,
    };
  }

  /**
   * Scans a URL and returns information about whether it's safe and its category
   */
  async scanUrl(url: string): Promise<UrlScanResult> {
    try {
      return await this.getAndProcessResults(url);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error scanning URL: ${error.message}`);
      }
      throw new Error('Error scanning URL: Unknown error');
    }
  }
}