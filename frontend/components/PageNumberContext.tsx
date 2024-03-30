import React, { createContext, useContext, useState } from 'react';

interface PageNumberContextType {
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
}

export const PageNumberContext = createContext<PageNumberContextType>({
  pageNumber: 1,
  setPageNumber: () => {},
});


export const usePageNumber = () => {
  const context = useContext(PageNumberContext);
  if (context === undefined) {
    throw new Error('usePageNumber must be used within a PageNumberProvider');
  }
  return context;
};