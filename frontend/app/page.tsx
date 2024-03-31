"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import SearchResults from "@/components/SearchResults";
import axios from "axios";
import dynamic from 'next/dynamic';

const FileViewer = dynamic(() => import('../components/FileViewer'), { ssr: false });
import { PageNumberContext } from '@/components/PageNumberContext';
import FileDropZone from "@/components/FileDropZone";


interface EmbedData {
  sentences: string[];
  vectors: number[][];
}


export default function Home() {
  const [pageNumber, setPageNumber] = useState(1);

  // For PDF exclusively 
  const [docData, setDocData] = useState<string | null>(null);
  const [docEmbedData, setDocEmbedData] = useState<Promise<EmbedData[]> | null>(null);
  const [shouldShowPdf, setShouldShowPdf] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleFilesSelected = (files: File[]) => {    
    const file = files.find(f => f.type === 'application/pdf');
    if (file) {
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target !== null && typeof event.target.result === 'string') {
          setDocData(event.target.result);
          setIsLoading(true);
          setShouldShowPdf(true);
        } else {
          // Handle the case when event.target.result is not a string
          console.error('FileReader result is not a string.');
        }
      };

      reader.readAsDataURL(file);
      setDocEmbedData(sendPdfToText(file).then(processData) as Promise<EmbedData[]>);
      
    }

    // No PDF file present, now check for other kinds
    // else if (files.length > 0) {
    //   const file = files[0];
    //   console.log(file);
    //   if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    //     setTextEmbedData(convertTxtDocxToEmbedding(file, 'docx'));
    //   }
    //   else if (file.type === 'text/plain') {
    //     setTextEmbedData(convertTxtDocxToEmbedding(file, 'txt'));
    //   }
    // }


  };

  // Function to send pdf to /api/v1/pdf-to-text endpoint
  const sendPdfToText = async (pdfFile: File) => {
    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
        const response = await axios.post('/api/pdf-to-text', formData, {
          headers: {},
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending pdf to API:', error);
        return null;
    }
};


// const convertTxtDocxToEmbedding = async (file, filetype) => {
//   // Ensure filetype is docx or txt
//   if (filetype !== 'docx' && filetype !== 'txt') {
//     return null;
//   }

//   let text = null;

//   // Convert file to text
//   if (filetype == 'docx') {
//     text = await sendDocxToText(file);
//   }
//   else if (filetype == 'txt') {
//     text = await sendTxtToText(file);
//   }

//   text = text.text; // Other data is filename, for now not using, but still including here rather than only returning text from sendDocxToText and sendTxtToText
  
//   setTextData(text);
  
//   let results = "";
//   setIsLoading(true);
//   setLoadingMessage('Processing text...');

//   const params = new URLSearchParams();
//   params.append('text', text);
//   params.append('filter', 'true');

//   const response = await axios.post(`http://127.0.0.1:8000/api/v1/text-split-and-embed?${params.toString()}`);
//   results = response.data;

//   setLoadingMessage('');
//   setIsLoading(false);
//   console.log(results);

// };


// const sendTxtToText = async (txtFile) => {
//   const formData = new FormData();
//   formData.append('file', txtFile);

//   try {
//     const response = await axios.post('http://127.0.0.1:8000/api/v1/txt-to-text', formData, {
//         headers: {
//             'Content-Type': 'multipart/form-data',
//         },
//     });
//     console.log(response.data);
//     return response.data;
// } catch (error) {
//     console.error('Error sending pdf to API:', error);
//     return null;
// }
// };

// const sendDocxToText = async (docxFile) => {
//   const formData = new FormData();
//   formData.append('file', docxFile);
//   try {
//     const response = await axios.post('http://127.0.0.1:8000/api/v1/docx-to-text', formData, {
//         headers: {
//             'Content-Type': 'multipart/form-data',
//         },
//     });
//     console.log(response.data);
//     return response.data;
// } catch (error) {
//     console.error('Error sending pdf to API:', error);
//     return null;
// }
// };


interface ProcessDataInput {
  text: {
    [key: string]: string;  // key-value pairs, where the value is the text content
  };
}


const processData = async (data: ProcessDataInput): Promise<EmbedData[] | null> => {
  setIsLoading(true); // redundant

  if (data==null || !data.text) {
    console.error('No text data found in processData');
    setLoadingMessage('Error processing text, please try again later.');
    return null;
  }

  setLoadingMessage('Processing text...');
  const textItems = Object.values(data.text);
    

    let results = [];
    let page_number = 1;

    for (let text of textItems) {
        setLoadingMessage(`Processing page ${page_number++} of ${textItems.length}`);

        // Var 1
        // if (page_number%2==0){
        //   setPageNumber(page_number-1);
        // }
        // console.log(page_number);

        try {
            // Construct the query parameters
            // const params = new URLSearchParams();
            // params.append('text', text);
            // params.append('filter', 'true');

            const response = await axios.post('/api/text-split-and-embed', {
              text: text,
              filter: 'true'
            });

            results.push(response.data);
        } catch (error) {
            console.error('Error processing text item:', error);
        }
    }

    setPageNumber(1);
    setLoadingMessage('');
    setIsLoading(false);

    return results;
};


  return (
    <PageNumberContext.Provider value={{ pageNumber, setPageNumber }}>
  

    <AnimatePresence>
      <div className="min-h-[100vh] sm:min-h-screen w-screen flex flex-col relative bg-[#F2F3F5] font-inter">

        <main id="mainContent" className="font-inter flex-col justify-center h-[100%] static md:fixed w-screen grid-rows-[1fr_repeat(3,auto)_1fr] z-[100] pt-[30px] pb-[320px] px-4 md:px-20 md:py-0" style={{overflow:"scroll"}}>
         
         <div className="flex flex-col md:mt-[10vh]">

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.95,
              ease: [0.165, 0.84, 0.44, 1],
            }}
            className="relative md:ml-[-10px] md:mb-[37px] font-extrabold text-[16vw] md:text-[100px] font-inter text-[#1E2B3A] leading-[1.1] tracking-[-2px] z-[100]"
            style={{textAlign: 'center'}}
          >
            Drag, Drop,<br />
            <span className="text-[#407BBF]">Semantic</span> Search.
          </motion.h1>

          <div style={{width:"100%", display:"grid",placeItems:"center"}}>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.95,
              ease: [0.165, 0.84, 0.44, 1],
            }}
            className="flex flex-row justify-center z-20 mx-0 mb-0 mt-8 md:mt-0 md:mb-[45px] max-w-2xl md:space-x-8"
            style={{marginLeft:"30px",marginRight:"30px"}}
          >
            <div className="w-1/2">
              <h2 className="flex items-center font-semibold text-[1em] text-[#1a2b3b]">
                (1) Upload
              </h2>
              <p className="text-[14px] leading-[20px] text-[#1a2b3b] font-normal">
                Upload your PDF file. We&apos;ll automatically scan, convert, and embed the pages for search.
                {/* Upload PDFs, Word Documents, and more. We&apos;ll automatically scan, convert, and embed them. */}
              </p>
            </div>
            <div className="w-1/2">
              <h2 className="flex items-center font-semibold text-[1em] text-[#1a2b3b]">
                (2) Search
              </h2>
              <p className="text-[14px] leading-[20px] text-[#1a2b3b] font-normal">
                Instantly semantic search across all your files. We&apos;ll highlight the most relevant results.
              </p>
            </div>
          </motion.div>

          {!shouldShowPdf && (

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.15,
              duration: 0.95,
              ease: [0.165, 0.84, 0.44, 1],
            }}
            className="flex flex-row justify-center z-20 mx-0 mb-0 mt-8 md:mt-0 md:mb-[35px] md:space-x-8 hidden md:block"
            style={{width:"100%", maxWidth:"1000px"}}
          >

          <FileDropZone onFilesSelected={handleFilesSelected} />

            </motion.div>
)}


{!shouldShowPdf && (
<motion.div
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    delay: 0.55,
    duration: 0.55,
    ease: [0.075, 0.82, 0.965, 1],
  }}
  style={{
    position: "fixed",
    bottom: "20px",
    display: "flex",
    justifyContent: "center",
    left: "calc(50% - 90px)",
    zIndex: 100,
  }}
>
              <Link
                href="https://github.com/Bklieger/Semantic"
                target="_blank"
                className="group rounded-full pl-[16px] min-w-[180px] py-3 px-4 text-[14px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2  active:scale-95 scale-100 duration-75"
                style={{
                  boxShadow:
                    "0px 1px 4px rgba(13, 34, 71, 0.17), inset 0px 0px 0px 1px #061530, inset 0px 0px 0px 2px rgba(255, 255, 255, 0.1)",
                }}
              >
                Star ⭐ on Github
              </Link>
            </motion.div>
)}

{shouldShowPdf && (
<motion.div
  initial={{ opacity: 0, y: 0 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    delay: 0.55,
    duration: 0.55,
    ease: [0.075, 0.82, 0.965, 1],
  }}
  style={{
    position: "fixed",
    bottom: "20px",
    right: "20px",

    zIndex: 100,
  }}
>
              <Link
                href="https://github.com/Bklieger/Semantic"
                target="_blank"
                className="group rounded-full pl-[16px] min-w-[180px] py-3 px-4 text-[14px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2  active:scale-95 scale-100 duration-75"
                style={{
                  boxShadow:
                    "0px 1px 4px rgba(13, 34, 71, 0.17), inset 0px 0px 0px 1px #061530, inset 0px 0px 0px 2px rgba(255, 255, 255, 0.1)",
                }}
              >
                Star ⭐ on Github
              </Link>
            </motion.div>

            )}

           
  {/*
          <div className="flex gap-[15px] mt-8 md:mt-0 hidden md:flex">
           
           
          

         <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.65,
                duration: 0.55,
                ease: [0.075, 0.82, 0.965, 1],
              }}
              className="group rounded-full py-3 px-4 text-[14px] font-semibold transition-all flex items-center justify-center bg-[#f5f7f9] text-[#1E2B3A] no-underline active:scale-95 scale-100 duration-75"
                style={{
                  boxShadow: "0 1px 1px #0c192714, 0 1px 3px #0c192724",
                }}
              >
                <span className="mr-2"> Upload Multiple Files </span>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.75 6.75L19.25 12L13.75 17.25"
                    stroke="#1E2B3A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 12H4.75"
                    stroke="#1E2B3A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
             
            </motion.div>



          </div>
 */}


          </div>
          <motion.div 
initial={{ opacity: 0, y: 40 }}
animate={{ opacity: 1, y: 0 }}
transition={{
  delay: 0.15,
  duration: 0.95,
  ease: [0.165, 0.84, 0.44, 1],
}}
className="flex flex-row justify-center items-start space-x-4 block md:hidden"
>
<p className="text-[26px] leading-[20px] text-[#5e6973] font-normal leading-[1.4]" style={{textAlign:"center",marginTop:"80px",fontWeight:"700",marginBottom:"40px"}}>
 <em>Please view on a larger screen to use SemanticPDF.</em>
              </p>
</motion.div>


{shouldShowPdf && 
     
<div style={{width:"100%",display: "flex",justifyContent: "center",alignItems: "center"}}>

<motion.div 
initial={{ opacity: 0, y: 40 }}
animate={{ opacity: 1, y: 0 }}
transition={{
  delay: 0.15,
  duration: 0.95,
  ease: [0.165, 0.84, 0.44, 1],
}}
className="flex flex-row justify-center items-start space-x-4"
style={{maxWidth:"1420px"}}
>
    <div className="flex-1" style={{ maxWidth: '780px', marginTop: '20px', marginBottom: '120px',paddingLeft:'20px' }}>
        <FileViewer docData={docData} />
    </div>

    <div className="flex-1" style={{paddingRight:'20px'}}>
        <SearchResults docEmbedData={docEmbedData} isLoading={isLoading} loadingMessage={loadingMessage}/>
    </div>
</motion.div>

</div>
}


<motion.div
  initial={{ opacity: 0, y: 0 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    delay: 0.55,
    duration: 0.55,
    ease: [0.075, 0.82, 0.965, 1],
  }}
>
<footer className="md:bg-gray-100 py-4" style={{marginTop:"-40px",marginRight:"10px"}}>
      <div className="container mx-auto text-center">
        <a href="https://app.termly.io/document/terms-of-service/2b9df3cf-fd6e-435a-8da6-89fe21179fc9" className="text-gray-500 hover:underline text-sm mr-2">
          Terms of Service
        </a>
        <span className="text-gray-500">·</span>
        <a href="https://app.termly.io/document/privacy-policy/f2bf3d22-8e96-4fd7-848a-358881a36a2c" className="text-gray-500 hover:underline text-sm ml-2">
          Privacy Policy
        </a>
      </div>
    </footer>
    </motion.div>



    </div>
        </main>
      </div>
    </AnimatePresence>
    </PageNumberContext.Provider>

  );
}
