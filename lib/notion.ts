import { Client } from "@notionhq/client";

if (!process.env.NOTION_API_KEY) {
  console.warn(
    "⚠️  NOTION_API_KEY is not set. Notion integration will not work. Please add it to your .env file.",
  );
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export default notion;
