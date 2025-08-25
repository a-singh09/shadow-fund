import { GoogleGenAI } from "@google/genai";
import {
  GeminiTextResponse,
  GeminiImageResponse,
  GeminiComparisonResponse,
  GeminiTranslationResponse,
  GeminiManipulationResponse,
  GeminiBatchRequest,
  GeminiBatchResponse,
  AITrustError,
} from "../types/aiTrust";

export class GeminiClient {
  private client: GoogleGenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!this.apiKey) {
      throw new Error("VITE_GEMINI_API_KEY environment variable is required");
    }

    // Initialize the client with API key
    this.client = new GoogleGenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Analyze text content using Gemini API
   */
  async analyzeText(
    prompt: string,
    content: string,
  ): Promise<GeminiTextResponse> {
    try {
      const fullPrompt = `${prompt}\n\nContent to analyze:\n${content}`;

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          temperature: 0.1, // Low temperature for consistent analysis
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          thinkingConfig: {
            thinkingBudget: 0, // Disable thinking for faster responses
          },
        },
      });

      return {
        text: response.text,
        confidence: this.calculateConfidence(response),
        metadata: {
          model: "gemini-2.5-flash",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw this.handleError(error, "TEXT_ANALYSIS");
    }
  }

  /**
   * Compare two texts for semantic similarity
   */
  async compareTexts(
    text1: string,
    text2: string,
  ): Promise<GeminiComparisonResponse> {
    try {
      const prompt = `
        Compare these two texts for semantic similarity. Analyze:
        1. Overall similarity score (0-100)
        2. Key matching concepts and phrases
        3. Potential duplicate content indicators
        4. Language and style similarities
        
        Provide your response in JSON format:
        {
          "similarity": <number 0-100>,
          "confidence": <number 0-1>,
          "analysis": "<detailed analysis>",
          "matchedSegments": [
            {
              "text": "<matched text>",
              "similarity": <number 0-1>
            }
          ]
        }

        Text 1: ${text1}
        
        Text 2: ${text2}
      `;

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      // Parse JSON response
      const parsedResponse = this.parseJsonResponse(response.text);

      return {
        similarity: parsedResponse.similarity / 100, // Convert to 0-1 scale
        confidence:
          parsedResponse.confidence || this.calculateConfidence(response),
        matchedSegments: parsedResponse.matchedSegments || [],
        analysis: parsedResponse.analysis || response.text,
      };
    } catch (error) {
      throw this.handleError(error, "TEXT_COMPARISON");
    }
  }

  /**
   * Translate text to target language
   */
  async translateText(
    text: string,
    targetLanguage: string,
  ): Promise<GeminiTranslationResponse> {
    try {
      const prompt = `
        Translate the following text to ${targetLanguage}. Also detect the original language.
        Provide your response in JSON format:
        {
          "translatedText": "<translated text>",
          "detectedLanguage": "<detected language>",
          "confidence": <number 0-1>
        }

        Text to translate: ${text}
      `;

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const parsedResponse = this.parseJsonResponse(response.text);

      return {
        translatedText: parsedResponse.translatedText || response.text,
        detectedLanguage: parsedResponse.detectedLanguage || "unknown",
        confidence:
          parsedResponse.confidence || this.calculateConfidence(response),
      };
    } catch (error) {
      throw this.handleError(error, "TEXT_TRANSLATION");
    }
  }

  /**
   * Analyze image content
   */
  async analyzeImage(
    imageData: ArrayBuffer,
    prompt: string,
  ): Promise<GeminiImageResponse> {
    try {
      const base64Data = this.arrayBufferToBase64(imageData);

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: "image/jpeg", // Assume JPEG, could be enhanced to detect mime type
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      return {
        analysis: response.text,
        confidence: this.calculateConfidence(response),
        metadata: {
          model: "gemini-2.5-flash",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw this.handleError(error, "IMAGE_ANALYSIS");
    }
  }

  /**
   * Detect image manipulation
   */
  async detectImageManipulation(
    imageData: ArrayBuffer,
  ): Promise<GeminiManipulationResponse> {
    try {
      const prompt = `
        Analyze this image for signs of manipulation, editing, or artificial generation.
        Look for:
        1. Inconsistent lighting or shadows
        2. Unnatural edges or artifacts
        3. Color inconsistencies
        4. Signs of copy-paste or cloning
        5. AI-generated content indicators
        
        Provide your response in JSON format:
        {
          "isManipulated": <boolean>,
          "confidence": <number 0-1>,
          "manipulationType": ["<type1>", "<type2>"],
          "analysis": "<detailed analysis>"
        }
      `;

      const base64Data = this.arrayBufferToBase64(imageData);

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: "image/jpeg",
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const parsedResponse = this.parseJsonResponse(response.text);

      return {
        isManipulated: parsedResponse.isManipulated || false,
        confidence:
          parsedResponse.confidence || this.calculateConfidence(response),
        manipulationType: parsedResponse.manipulationType || [],
        analysis: parsedResponse.analysis || response.text,
      };
    } catch (error) {
      throw this.handleError(error, "IMAGE_MANIPULATION_DETECTION");
    }
  }

  /**
   * Process batch requests
   */
  async batchAnalyze(
    requests: GeminiBatchRequest[],
  ): Promise<GeminiBatchResponse> {
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          let data;
          switch (request.type) {
            case "TEXT":
              data = await this.analyzeText(
                request.prompt,
                request.content as string,
              );
              break;
            case "IMAGE":
              data = await this.analyzeImage(
                request.content as ArrayBuffer,
                request.prompt,
              );
              break;
            case "COMPARISON":
              const [text1, text2] = (request.content as string).split("|||");
              data = await this.compareTexts(text1, text2);
              break;
            case "TRANSLATION":
              const targetLang = request.options?.targetLanguage || "en";
              data = await this.translateText(
                request.content as string,
                targetLang,
              );
              break;
            default:
              throw new Error(`Unsupported request type: ${request.type}`);
          }
          return { id: request.id, success: true, data };
        } catch (error) {
          return {
            id: request.id,
            success: false,
            error: this.handleError(error, "BATCH_REQUEST"),
          };
        }
      }),
    );

    return {
      results: results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            id: requests[index].id,
            success: false,
            error: this.handleError(result.reason, "BATCH_REQUEST"),
          };
        }
      }),
    };
  }

  /**
   * Calculate confidence score from response
   */
  private calculateConfidence(response: any): number {
    // Simple confidence calculation based on response characteristics
    // In a real implementation, this could be more sophisticated
    const text = response.text || "";
    if (!text || text.length < 10) return 0.1;

    // Check for uncertainty indicators
    const uncertaintyWords = [
      "maybe",
      "possibly",
      "might",
      "could be",
      "uncertain",
    ];
    const hasUncertainty = uncertaintyWords.some((word) =>
      text.toLowerCase().includes(word),
    );

    return hasUncertainty ? 0.6 : 0.8;
  }

  /**
   * Parse JSON response with error handling
   */
  private parseJsonResponse(text: string): any {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      return JSON.parse(jsonText);
    } catch (error) {
      console.warn("Failed to parse JSON response:", error);
      return {};
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: any, context: string): AITrustError {
    console.error(`Gemini API Error in ${context}:`, error);

    // API-specific error handling
    if (error?.message?.includes("API key")) {
      return {
        code: "INVALID_API_KEY",
        message: "Invalid or missing Gemini API key",
        category: "API",
        retryable: false,
        fallbackAction: "Check API key configuration",
      };
    }

    if (
      error?.message?.includes("quota") ||
      error?.message?.includes("rate limit")
    ) {
      return {
        code: "RATE_LIMIT_EXCEEDED",
        message: "API rate limit exceeded",
        category: "API",
        retryable: true,
        fallbackAction: "Retry after delay",
      };
    }

    if (error?.message?.includes("safety")) {
      return {
        code: "CONTENT_SAFETY_VIOLATION",
        message: "Content blocked by safety filters",
        category: "DATA",
        retryable: false,
        fallbackAction: "Review content for policy violations",
      };
    }

    if (
      error?.message?.includes("network") ||
      error?.message?.includes("fetch")
    ) {
      return {
        code: "NETWORK_ERROR",
        message: "Network connection failed",
        category: "API",
        retryable: true,
        fallbackAction: "Check internet connection",
      };
    }

    // Generic error
    return {
      code: "UNKNOWN_ERROR",
      message: error?.message || "Unknown error occurred",
      category: "API",
      retryable: true,
      fallbackAction: "Try again later",
    };
  }
}

// Export singleton instance
export const geminiClient = new GeminiClient();
