import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { PageNumberContext } from '@/components/PageNumberContext';

interface EmbedData {
  sentences: string[];
  vectors: number[][];
}

interface SearchResultsProps {
  docEmbedData: Promise<EmbedData[]> | null;
    isLoading: boolean;
    loadingMessage?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ docEmbedData, isLoading, loadingMessage }) => {
const { setPageNumber } = useContext(PageNumberContext);
const handlePageClick = (pageNumber: number) => {
    // Call setPageNumber with the clicked page number
    setPageNumber(pageNumber);
  };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [resolvedDocData, setResolvedDocData] = useState<EmbedData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  useEffect(() => {
    if (docEmbedData) {
      docEmbedData.then(data => {
        setResolvedDocData(data);
      }).catch(error => {
        console.error('Error resolving docEmbedData:', error);
      });
    } else {
      // Handle the situation when docEmbedData is null, if necessary
      console.error('docEmbedData is null');
    }
  }, [docEmbedData]);
  

  const handleSearch = async () => {
  
    if (!Array.isArray(resolvedDocData)) {
      console.error('resolvedDocData is not an array');
      return;
    }

    setIsSearching(true);

    let aggregatedResults = [];
  
    for (const [pageIndex, pageData] of resolvedDocData.entries()) {

      try {
        setSearchMessage(`Searching page ${pageIndex + 1} of ${resolvedDocData.length}`);
        const response = await axios.post('/api/semantic-search', {
            query: query,
            sentences: pageData.sentences,
            vectors: pageData.vectors
        });
        
        type ResultTuple = [string, number];

        const pageResults = response.data.results.map(([sentence, score]: ResultTuple) => ({
          sentence,
          score,
          page: pageIndex + 1
        }));
  
        aggregatedResults.push(...pageResults);

        aggregatedResults.sort((a, b) => b.score - a.score);
        // Filter any results with score below 0.1, or any results with content length below 10 characters
        aggregatedResults = aggregatedResults.filter(result => result.score > 0.1 && result.sentence.length > 10);
        
        if (pageIndex < 20){
            setResults(aggregatedResults.slice(0, pageIndex)); // Truncate results to first pageIndex (limits low quality results from showing due to low page count searched)
        }
        else {
            setResults(aggregatedResults.slice(0, 100)); // Truncate results to first 100
        }


      } catch (error) {
        console.error('Error in semantic search:', error);
      }
  
      // Force a re-render to update the loading message for each page
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  
    // Filter any results with score below 0.1, or any results with content length below 10 characters
    aggregatedResults = aggregatedResults.filter(result => result.score > 0.1 && result.sentence.length > 10);
    aggregatedResults.sort((a, b) => b.score - a.score);
    setResults(aggregatedResults.slice(0, 100)); // Truncate results to first 100
    setIsSearching(false);

  };

  return (
    <div className="container mx-auto px-4">
  {isLoading ? (
    <div className="flex flex-col my-6">
      <p className="text-md mb-4">{loadingMessage || 'Loading...'}</p>
    </div>
  ) : (
    <>
      <div className="flex justify-center my-6">
        <input
          type="text"
          className="form-input px-4 py-2 w-full max-w-xl border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Describe your query. Matches based on meaning, not keywords."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="ml-2 px-4 py-2 bg-[#407BBF] text-white font-semibold rounded-md shadow hover:bg-[#396EAB] focus:outline-none"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
      <div className="mt-4"  style={{maxWidth:"900px",minWidth:"600px"}}>
        {isSearching && <p className="text-md mb-4">{searchMessage || 'Searching...'}</p>}
        <ul style={{maxHeight:"800px",overflow:"scroll",marginBottom:"40px"}}>
          {results.map((result, index) => (
            <li key={index} className="py-2 border-b border-gray-200">
                <a
                href="#"
                onClick={() => handlePageClick(result.page)}
                className="cursor-pointer underline"
                style={{color:"#407BBF", fontWeight:"bold"}}
            >
                Page {result.page}
            </a>
            : &quot;{result.sentence}&quot; (Score: {result.score.toFixed(2)})
            </li>

          ))}
        </ul>
      </div>
    </>
  )}
</div>

  );
};

export default SearchResults;
