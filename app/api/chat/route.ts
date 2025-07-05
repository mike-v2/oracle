import { createOpenAI } from '@ai-sdk/openai';
import { streamText, type CoreMessage, generateText } from 'ai';
import pinecone from '@/lib/pinecone';
import type { Article } from "@/types";

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('Missing DEEPSEEK_API_KEY in environment variables');
}
if (!process.env.PINECONE_INDEX) {
  throw new Error('Missing PINECONE_INDEX in environment variables');
}
if (!process.env.PINECONE_HOST) {
  throw new Error('Missing PINECONE_HOST in environment variables');
}

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

const pineconeIndex = pinecone.index(
  process.env.PINECONE_INDEX,
  process.env.PINECONE_HOST,
);
const namespace = pineconeIndex.namespace('articles');

export async function POST(req: Request) {
  const { messages, filters }: { messages: CoreMessage[]; filters: any } =
    await req.json();

  const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const queryGenerationPrompt = `You are a helpful assistant that generates search queries based on a conversation.
The user is having a conversation with a chatbot. Given the conversation history, you need to generate a self-contained search query that can be used to retrieve relevant articles from a vector database.
The search query should be based on the last user message, but also incorporate context from previous messages if necessary to make the query specific and self-contained.

Here is the conversation history:
---
${conversation}
---

Generate a search query.`;

  const { text: contextualQuery } = await generateText({
    model: deepseek('deepseek-chat'),
    prompt: queryGenerationPrompt,
    temperature: 0.0,
  });
  console.log('contextualQuery:', contextualQuery);

  const latestMessage = messages[messages.length - 1];
  
  const pineconeFilter: any = {};
  if (filters.publications?.length) {
    pineconeFilter.publication = { '$in': filters.publications };
  }
  
  const dateFilter: any = {};
  if (filters.dateRange?.from) {
    dateFilter['$gte'] = new Date(filters.dateRange.from).getTime() / 1000;
  }
  if (filters.dateRange?.to) {
    dateFilter['$lte'] = new Date(filters.dateRange.to).getTime() / 1000;
  }

  if (Object.keys(dateFilter).length > 0) {
    pineconeFilter.publication_date = dateFilter;
  }

  const searchResponse = await namespace.searchRecords({
    query: {
      topK: 15,
      inputs: { text: contextualQuery },
      filter: pineconeFilter,
    },
    fields: ['*'], // Request all metadata fields
  });

  const sources: Article[] =
    (searchResponse as any)?.result?.hits
      ?.map((hit: any) => ({ ...hit.fields, id: hit._id, score: hit._score }))
      .filter((item: Article | undefined): item is Article => !!item) ?? [];

  const context = sources
    .map(
      (article) =>
        `Source:\nPublication: ${article.publication}\nTitle: ${
          article.title
        }\nText: ${article.text.substring(0, 500)}`
    )
    .join("\n\n");

  const prompt = `
Answer the following question using ONLY the provided sources.

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
    { role: 'system', content: prompt },
    latestMessage,
  ];

  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: augmentedMessages,
  });

  const sourcesJson = JSON.stringify(sources);
  const encodedSources = Buffer.from(sourcesJson).toString('base64');

  return result.toDataStreamResponse({
    headers: {
      'X-Sources': encodedSources,
    },
  });
} 