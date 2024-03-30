import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    error:
      "Thank you for using SemanticPDF! Since we offer this service for free, we have to limit the number of requests. Please try again in a few hours.",
  });
  return res.end();
}
