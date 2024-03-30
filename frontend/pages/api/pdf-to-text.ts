import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

if (!process.env.API_BASE_URL || !process.env.API_AUTH_TOKEN) {
  throw new Error("Missing API environment variables");
}

const API_BASE_URL = process.env.API_BASE_URL;
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Collect the raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const requestBody = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] as string;

    // Forward the request to the external API
    const response = await axios.post(`${API_BASE_URL}/api/v1/pdf-to-text`, requestBody, {
      headers: {
        'Authorization': `Bearer ${API_AUTH_TOKEN}`,
        'Content-Type': contentType, // Preserve the content type
      },
    });

    // Send the response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error sending pdf to API:', error);
    res.status(500).json({ message: 'Error sending pdf to API.' });
  }
}
