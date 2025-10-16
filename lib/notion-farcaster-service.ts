import { Client } from "@notionhq/client";

export interface FarcasterUsernameMapping {
  id: string;
  name: string;
  x_username: string;
  farcaster_username: string;
}

export class NotionFarcasterService {
  private notion: Client;
  private databaseId: string;
  private hasLoggedProperties = false;

  constructor() {
    if (!process.env.NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY environment variable is required");
    }
    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error("NOTION_DATABASE_ID environment variable is required");
    }

    this.notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });
    this.databaseId = process.env.NOTION_DATABASE_ID;
  }

  async getAllMappings(): Promise<FarcasterUsernameMapping[]> {
    try {
      console.log("Querying database:", this.databaseId);

      const response = await fetch(
        `https://api.notion.com/v1/databases/${this.databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }

      const data = await response.json();
      console.log("Query successful, got", data.results.length, "results");

      const results = data.results.map((page: any) =>
        this.transformNotionPageToMapping(page as Record<string, any>),
      );

      // Filter out null values (invalid records)
      return results.filter(
        (
          mapping: FarcasterUsernameMapping | null,
        ): mapping is FarcasterUsernameMapping => mapping !== null,
      );
    } catch (error) {
      console.error("Failed to fetch mappings from Notion:", error);
      throw new Error("Failed to fetch Farcaster username mappings");
    }
  }

  async getMappingByXUsername(
    xUsername: string,
  ): Promise<FarcasterUsernameMapping | null> {
    try {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${this.databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: {
              property: "x_username",
              rich_text: {
                equals: xUsername,
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }

      const data = await response.json();

      if (data.results.length === 0) {
        return null;
      }

      const page = data.results[0];
      if (!page) {
        return null;
      }

      return this.transformNotionPageToMapping(page as Record<string, any>);
    } catch (error) {
      console.error(
        `Failed to fetch mapping for ${xUsername} from Notion:`,
        error,
      );
      throw new Error(
        `Failed to fetch Farcaster username mapping for ${xUsername}`,
      );
    }
  }

  async getUsernameMappingObject(): Promise<Record<string, string>> {
    const mappings = await this.getAllMappings();

    return mappings.reduce(
      (acc, mapping) => {
        if (mapping.x_username && mapping.farcaster_username) {
          acc[mapping.x_username.toLowerCase()] = mapping.farcaster_username;
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  private transformNotionPageToMapping(
    page: Record<string, any>,
  ): FarcasterUsernameMapping | null {
    try {
      const properties = page.properties;

      // Debug: Log the first page's property names
      if (!this.hasLoggedProperties) {
        console.log("Available properties:", Object.keys(properties));
        console.log("Full properties:", JSON.stringify(properties, null, 2));
        this.hasLoggedProperties = true;
      }

      return {
        id: page.id,
        name: this.extractText(properties.Name?.title) || "",
        x_username: this.extractText(properties["x_username"]?.rich_text) || "",
        farcaster_username:
          this.extractText(properties["farcaster_username"]?.rich_text) ||
          this.extractText(properties.farcaster?.rich_text) ||
          "",
      };
    } catch (error) {
      console.error("Failed to transform Notion page to mapping:", error);
      console.error(
        "Page properties:",
        JSON.stringify(page.properties, null, 2),
      );
      return null;
    }
  }

  private extractText(richTextArray: any[]): string {
    if (
      !richTextArray ||
      !Array.isArray(richTextArray) ||
      richTextArray.length === 0
    ) {
      return "";
    }
    return richTextArray[0]?.text?.content || "";
  }
}

// Export the service instance
const notionFarcasterService = new NotionFarcasterService();

export const getAllMappings = (): Promise<FarcasterUsernameMapping[]> =>
  notionFarcasterService.getAllMappings();
export const getMappingByXUsername = (
  xUsername: string,
): Promise<FarcasterUsernameMapping | null> =>
  notionFarcasterService.getMappingByXUsername(xUsername);
export const getUsernameMappingObject = (): Promise<Record<string, string>> =>
  notionFarcasterService.getUsernameMappingObject();
