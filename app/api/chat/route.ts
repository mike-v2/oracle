import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage, generateText } from "ai";
import { format } from "date-fns";
import pinecone from "@/lib/pinecone";
import type { Article } from "@/types";
import { publications } from "@/lib/constants";
import { DateRange } from "react-day-picker";

export const maxDuration = 60;

// Type definitions
interface RequestFilters {
  publications?: string[];
  dateRange?: DateRange;
}

interface PineconeFilter {
  publication?: string;
  publication_date?: {
    $gte?: number;
    $lte?: number;
  };
  $or?: Array<{ publication: string }>;
  $and?: Array<PineconeFilter>;
}

interface DateFilter {
  $gte?: number;
  $lte?: number;
}

interface PineconeHit {
  _id: string;
  _score: number;
  fields: Article;
}

interface PineconeSearchResponse {
  result?: {
    hits?: PineconeHit[];
  };
}

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

const pineconeIndex = pinecone.index(
  process.env.PINECONE_INDEX!,
  process.env.PINECONE_HOST!
);
const namespace = pineconeIndex.namespace("articles");

export async function POST(req: Request) {
  const {
    messages,
    filters,
    useReasoningModel,
  }: {
    messages: CoreMessage[];
      filters: RequestFilters;
    useReasoningModel?: boolean;
  } = await req.json();

  const modelName = useReasoningModel ? "deepseek-reasoner" : "deepseek-chat";

  let contextualQuery = messages[0].content as string;
  if (messages.length > 1) {
    const conversation = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    const contextualQuerySystemPrompt = `You will be provided with a conversation history. Your task is to generate a search query based on this history. You must output the query in a JSON format, with a single key "query".

EXAMPLE CONVERSATION:
user: I want to know about the latest developments in AI.
assistant: Sure, there have been many recent breakthroughs. Are you interested in large language models, computer vision, or something else?
user: Tell me about large language models.

EXAMPLE JSON OUTPUT:
{
    "query": "latest developments in large language models AI"
}`;

    const contextualQueryPrompt = `Conversation history:\n---\n${conversation}\n---`;

    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      system: contextualQuerySystemPrompt,
      prompt: contextualQueryPrompt,
      temperature: 0.0,
      // @ts-expect-error - responseFormat is a valid property
      responseFormat: { type: "json_object" },
    });

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    contextualQuery = JSON.parse(jsonString).query;
    console.log("contextualQuery:", contextualQuery);
  }

  const latestMessage = messages[messages.length - 1];

  let pineconeFilter: PineconeFilter = {};
  if (filters.publications?.length) {
    if (filters.publications.length === 1) {
      pineconeFilter.publication = filters.publications[0];
    } else {
      pineconeFilter = {
        $or: filters.publications.map((pub: string) => ({
          publication: pub,
        })),
      };
    }
  }

  const dateFilter: DateFilter = {};
  if (filters.dateRange?.from) {
    dateFilter["$gte"] = new Date(filters.dateRange.from).getTime() / 1000;
  }
  if (filters.dateRange?.to) {
    dateFilter["$lte"] = new Date(filters.dateRange.to).getTime() / 1000;
  }

  if (Object.keys(dateFilter).length > 0) {
    if (pineconeFilter.$or) {
      pineconeFilter = {
        $and: [pineconeFilter, { publication_date: dateFilter }],
      };
    } else {
      pineconeFilter.publication_date = dateFilter;
    }
  }

  console.log("Pinecone filter:", JSON.stringify(pineconeFilter, null, 2));

  const searchResponse: PineconeSearchResponse = await namespace.searchRecords({
    query: {
      topK: 15,
      inputs: { text: contextualQuery },
      filter: pineconeFilter,
    },
    fields: ["*"], // Request all metadata fields
  });

  const sources: Article[] =
    (searchResponse.result?.hits
      ?.map((hit: PineconeHit) => ({ ...hit.fields, id: hit._id, score: hit._score }))
      .filter((item: Article | undefined): item is Article => !!item)) ?? [];

  const publicationDisplayNameMap = new Map(
    publications.map((p) => [p.dbName, p.displayName])
  );

  const context = sources
    .map(
      (article) =>
        `Source:\nPublication: ${
          publicationDisplayNameMap.get(article.publication) ??
          article.publication
        }\nTitle: ${article.title}\nDate: ${format(
          new Date(article.publication_date),
          "yyyy-MM-dd"
        )}\nText: ${article.text.substring(0, 500)}`
    )
    .join("\n\n");

  const prompt = `
Answer the following question using ONLY the provided sources. Pay close attention to the date of each source to understand the context of the information.

<sources>
${context}
</sources>

When you answer, you MUST follow these guidelines:
1. For every factual claim you make, you must cite the source.
2. To cite a source, include the publication and title in parentheses at the end of the sentence, like this: (The Grayzone, The West's phantom 'moral majority' is a marketing tool for war).
3. If you are quoting directly from a source, enclose the quote in double quotation marks and add the citation, like this: "Direct quote from the article." (MintPress, How America's 'Radical' Foreign Policy Is Paving the Way for a Multipolar World).
4. Do not makeup information or use external knowledge.

Question: ${latestMessage.content as string}
`;

  // Add system prompt
  const augmentedMessages: CoreMessage[] = [
    ...messages.slice(0, -1),
    { role: "system", content: prompt },
    latestMessage,
  ];

  const result = streamText({
    model: deepseek(modelName),
    messages: augmentedMessages,
  });

  const sourcesJson = JSON.stringify(sources);
  const encodedSources = btoa(
    new TextEncoder()
      .encode(sourcesJson)
      .reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  return result.toDataStreamResponse({
    headers: {
      "X-Sources": encodedSources,
    },
  });
} 