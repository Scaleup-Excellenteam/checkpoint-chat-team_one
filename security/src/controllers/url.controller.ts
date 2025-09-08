import { Request, Response } from 'express';
import { UrlScanService } from '../services/url.service';

// Extract URL patterns from text
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

// Initialize the URL scan service with VirusTotal API key from env
const urlScanService = new UrlScanService(process.env.VIRUSTOTLAL_API_KEY || '');

/**
 * Extracts URLs from a text message
 */
export const extractUrls = (text: string): string[] => {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : []; // Return unique URLs
};

/**
 * Scans a URL and returns safety information
 */
export const scanUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const result = await urlScanService.scanUrl(url);
    res.status(200).json(result);
  } catch (error) {
    console.error('URL scan error:', error);
    res.status(500).json({ 
      error: 'Failed to scan URL', 
      message: (error as Error).message 
    });
  }
};

/**
 * Processes a message and scans any URLs found within it
 */
export const processMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Extract URLs from the message
    const urls = extractUrls(message);
    
    if (urls.length === 0) {
      res.status(200).json({ 
        safe: true, 
        message: 'No URLs found in the message',
        urls: []
      });
      return;
    }

    // Scan the first URL found (can be extended to scan all URLs)
    const scanResults = await urlScanService.scanUrl(urls[0]);

    res.status(200).json({
      safe: scanResults.isSafe,
      message: scanResults.isSafe
        ? `URL is safe and categorized as: ${scanResults.category}`
        : 'Warning: Potentially unsafe URL detected',
      url: urls[0],
      category: scanResults.category,
      score: scanResults.score
    });
  } catch (error) {
    console.error('Message processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process message', 
      message: (error as Error).message 
    });
  }
};