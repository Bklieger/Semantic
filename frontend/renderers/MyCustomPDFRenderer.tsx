import React, { useContext, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PageNumberContext } from '@/components/PageNumberContext';
import { motion } from "framer-motion";

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface CurrentDocument {
  fileData: string | null;
  fileName: string;
}

interface MainState {
  currentDocument: CurrentDocument;
}

interface MyCustomPDFRendererProps {
  mainState: MainState;
}



const MyCustomPDFRenderer: React.FC<MyCustomPDFRendererProps> = ({ mainState: { currentDocument } }) => {
  const { pageNumber, setPageNumber } = useContext(PageNumberContext);

  const [numPages, setNumPages] = useState<number>(0);
  const [inputPageNumber, setInputPageNumber] = useState<string>(pageNumber.toString());

  // ===== Fix refresh scroll to top issue =====
  const scrollToBottom = () => {
    const mainElement = document.getElementById('mainContent');

    // In 1 second scroll to bottom of main element
    // setTimeout(() => {
    //   mainElement.scrollTo({
    //     top: mainElement.scrollHeight,
    //     behavior: 'smooth'
    // });
    // }, 1);

    if (!mainElement) return;

    mainElement.scrollTo({
      top: mainElement.scrollHeight,
      behavior: 'smooth'
  });
};

useEffect(() => {
  scrollToBottom();
}, [pageNumber]);

  // ===== [End] Fix refresh scroll to top issue =====


  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPageNumber(e.target.value);
  };
  

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const newPageNumber = Math.min(Math.max(1, Number(inputPageNumber)), numPages);
    setPageNumber(newPageNumber);
  };

  useEffect(() => {
    setInputPageNumber(pageNumber.toString());
  }, [pageNumber]);

  return (
    <div id="my-pdf-renderer" className="flex flex-col items-center my-1">
      <Document file={currentDocument.fileData as string} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
  



      <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.15,
        duration: 0.95,
        ease: [0.165, 0.84, 0.44, 1],
      }}
      className="flex items-center justify-between my-4 w-full" style={{maxWidth:"625px"}}
      >


        <div className="flex flex-grow justify-center"> {/* Centered pagination */}
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            className="px-2 text-black rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
            disabled={pageNumber <= 1}
            style={{ borderWidth: "1px", borderColor: "black", marginLeft:"100px" }}
          >
            Prev
          </button>
  
          <span className="font-semibold text-gray-700" style={{ marginLeft: "15px", marginRight: "15px" }}>
            Page {pageNumber} of {numPages}
          </span>
  
          <button
            onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages))}
            className="px-2 text-black rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
            disabled={pageNumber >= numPages}
            style={{ borderWidth: "1px", borderColor: "black" }}
          >
            Next
          </button>
        </div>
  
        <div className="flex items-center space-x-2"> {/* Right-aligned input and Go button */}
          <form onSubmit={goToPage} className="flex items-center space-x-2">
            <input
              type="number"
              value={inputPageNumber}
              onChange={handleInputChange}
              className="input-no-spinners px-2 border rounded-md text-gray-700 border-gray-300 focus:outline-none focus:border-blue-500 transition duration-300 ease-in-out"
              min="1"
              max={numPages}
              style={{ width: "50px", marginRight: "5px" }}
            />
            <button
              type="submit"
              className="px-2 bg-[#407BBF] text-white hover:bg-[#396EAB] transition duration-300 ease-in-out"
              style={{ minWidth: "2rem", fontSize: "0.875rem", borderRadius: "5px", borderWidth: "2px", borderColor: "#407BBF", marginRight:"5px" }}
            >
              Go
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
  
};

export default MyCustomPDFRenderer;