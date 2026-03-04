import React, { createContext, useContext, useState } from 'react';

const PageTitleContext = createContext({ title: '', setTitle: () => {}, titleExtra: null, setTitleExtra: () => {} });

export const usePageTitle = () => useContext(PageTitleContext);

export const PageTitleProvider = ({ children }) => {
  const [title, setTitle] = useState('');
  const [titleExtra, setTitleExtra] = useState(null);
  return (
    <PageTitleContext.Provider value={{ title, setTitle, titleExtra, setTitleExtra }}>
      {children}
    </PageTitleContext.Provider>
  );
};
